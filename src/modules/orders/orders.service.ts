import { TransactionManager } from "@/infra/db/transaction-manager";
import { OrdersRepo } from "./orders.repo";
import { AppError } from "@/errors/app-error";
import { assertCheckoutReady, assertItemsValid, generateOrderCode } from "./orders.util";
import { ProductImageService } from "../product/product-image.service";
import { CheckoutSessionItemRow, CreateOrderInput } from "./orders.types";
import { findBestImage } from "@/shared/variant-image/resolver";
import { mapOrder, mapSessionToCreateOrderInput } from "./orders.mapper";
import { OrderPaymentsRepo } from "./order-payments/order-payments.repo";
import { mapMidtransWebhookToPayment } from "./order-payments/order-payments.mapper";
import { createSnapTransaction } from "./integrations/midtrans/midtrans.client";
import { buildMidtransPayload } from "./integrations/midtrans/midtrans.builder";
import { MidtransWebhookPayload } from "./order-payments/order-payments.schema";
import { PAYMENT_STATUS_RANK } from "./order-payments/order-payments.constants";
import { UserRepo } from "../user/user.repo";

export class OrdersService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly repo: OrdersRepo,
    private readonly productImageService: ProductImageService,
    private readonly orderPaymentsRepo: OrderPaymentsRepo,
    private readonly userRepo: UserRepo
  ) {}

  getOrder = async (userId: number, orderCode: string) => {
    const order = await this.repo.getOrderByCodeDetail(orderCode, userId);

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    const items = await this.repo.getOrderItemsDetail(order.id);

    // optional safety
    if (items.length === 0) {
      throw AppError.badRequest("Order has no items");
    }

    // mapping → DTO
    return mapOrder(order, items);
  };

  confirmCheckout = async (userId: number, sessionId: number) => {
    return this.tm.transaction(async (trx) => {
      // 1. GET SESSION
      const session = await this.repo.getCheckoutSessionForUpdate(sessionId, userId, trx);

      if (!session) {
        throw AppError.badRequest("Session already used or invalid");
      }

      if (session.expires_at < new Date()) {
        throw AppError.badRequest("Checkout session expired");
      }

      if (!session.address_id) {
        throw AppError.badRequest("Address not set");
      }

      if (!session.courier_code || !session.courier_service) {
        throw AppError.badRequest("Shipping method not set");
      }

      assertCheckoutReady(session);

      // 2. GET ITEMS + LOCK STOCK
      const items = await this.repo.getCheckoutSessionItemsForUpdate(sessionId, trx);

      if (items.length === 0) {
        throw AppError.badRequest("No items");
      }

      // 3. VALIDATE ITEMS
      assertItemsValid(items);

      // 5. PREPARE DATA
      const enrichedItems = await this.enrichItemsWithImages(items);

      const user = await this.userRepo.getUserById(userId, trx);

      if (!user) {
        throw AppError.notFound("User not found");
      }

      // 6. LOCK SESSION
      await this.repo.markSessionConverted(sessionId, trx);

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const base = mapSessionToCreateOrderInput(session, userId);

      const input: CreateOrderInput = {
        ...base,
        email: user.email,
        expiresAt,
        orderCode: generateOrderCode()
      };

      // 7. CREATE ORDER
      const order = await this.repo.createOrder(input, trx);

      // 8. INSERT ITEMS
      await this.repo.insertOrderItems(order.id, enrichedItems, trx);

      // 9. SHIPMENT
      await this.repo.insertShipment(
        {
          orderId: order.id,
          courierCode: session.courier_code,
          courierName: session.courier_name,
          courierService: session.courier_service,
          courierDescription: session.courier_description,
          shippingEtd: session.shipping_etd
        },
        trx
      );

      // LAST
      await this.repo.reduceStock(items, trx);

      return order.order_code;
    });
  };

  cancelOrder = async (userId: number, orderCode: string) => {
    return this.tm.transaction(async (trx) => {
      const order = await this.repo.getOrderByCodeForUpdate(orderCode, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      if (order.user_id !== userId) {
        throw AppError.forbidden();
      }

      if (order.payment_status === "PAID") {
        throw AppError.badRequest("Order already paid");
      }

      if (order.status === "CANCELLED" || order.status === "COMPLETED") {
        return; // idempotent / ignore
      }

      await this.repo.markOrderCancelled(order.id, trx);
    });
  };

  handleMidtransWebhook = async (payload: MidtransWebhookPayload) => {
    return this.tm.transaction(async (trx) => {
      // 1. FIND ORDER
      const order = await this.repo.getOrderByCodeForUpdate(payload.order_id, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      // 2. CHECK EXISTING PAYMENT
      const existing = await this.orderPaymentsRepo.findByTransactionId(payload.transaction_id, trx);

      const isFirstTime = !existing;
      const isProgression = existing && existing.transaction_status !== payload.transaction_status;

      console.log("webhook payload:", payload);

      // 3. INSERT / UPDATE PAYMENT
      if (isFirstTime) {
        const paymentInput = mapMidtransWebhookToPayment(payload, order.id);
        await this.orderPaymentsRepo.insertPayment(paymentInput, trx);
      } else if (isProgression) {
        const currentRank = PAYMENT_STATUS_RANK[existing.transaction_status] ?? 0;
        const incomingRank = PAYMENT_STATUS_RANK[payload.transaction_status] ?? 0;

        if (incomingRank < currentRank) {
          console.log("Ignore downgrade status", {
            current: existing.transaction_status,
            incoming: payload.transaction_status
          });
        } else {
          await this.orderPaymentsRepo.updatePaymentStatus(payload.transaction_id, payload, trx);
        }
      }
      // duplicate → no-op

      const status = payload.transaction_status;

      const isPaidEvent = status === "settlement" || (status === "capture" && payload.fraud_status === "accept");

      // 4. HANDLE PAYMENT FIRST (HIGHEST PRIORITY)
      if (isPaidEvent) {
        if (order.payment_status !== "PAID") {
          await this.repo.markOrderPaid(order.id, trx);
        }
        return;
      }

      // 5. GUARD FINAL STATES
      if (order.payment_status === "PAID") {
        return;
      }

      if (order.status === "CANCELLED" || order.status === "COMPLETED") {
        console.log("Ignore webhook for final order state", {
          orderId: order.id,
          status: order.status,
          incoming: payload.transaction_status
        });
        return;
      }

      // 6. OTHER STATES

      if (status === "expire") {
        await this.repo.markOrderExpired(order.id, trx);
        return;
      }

      if (status === "cancel" || status === "deny" || status === "failure") {
        await this.repo.markOrderFailed(order.id, trx);
        return;
      }

      // pending / authorize → no action
    });
  };

  createSnapToken = async (userId: number, orderCode: string) => {
    return this.tm.transaction(async (trx) => {
      const order = await this.repo.getOrderByCode(orderCode, userId, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      if (order.status === "CANCELLED" || order.status === "COMPLETED") {
        throw AppError.badRequest("Order is not payable");
      }

      if (order.payment_status === "PAID") {
        throw AppError.badRequest("Order already paid");
      }

      if (order.expires_at < new Date()) {
        throw AppError.badRequest("Order expired");
      }

      const items = await this.repo.getOrderItems(order.id, trx);

      const payload = buildMidtransPayload(order, items);

      const result = await createSnapTransaction(payload);

      return {
        token: result.token,
        redirect_url: result.redirect_url
      };
    });
  };

  private enrichItemsWithImages = async (items: CheckoutSessionItemRow[]) => {
    const productIds = [...new Set(items.map((i) => i.product_id))];

    const imageMap = await this.productImageService.getVariantImagesBulk(productIds);

    return items.map((item) => {
      const productImages = imageMap.get(item.product_id);

      const best = productImages ? (findBestImage(productImages.images, item.option_snapshot) ?? productImages.fallback) : null;

      return {
        ...item,
        image_id: best?.imageId ?? null,
        image_key: best?.imageKey ?? null
      };
    });
  };
}
