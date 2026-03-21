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

export class OrdersService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly repo: OrdersRepo,
    private readonly productImageService: ProductImageService,
    private readonly orderPaymentsRepo: OrderPaymentsRepo
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

      // 6. LOCK SESSION
      await this.repo.markSessionConverted(sessionId, trx);

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const base = mapSessionToCreateOrderInput(session, userId);

      const input: CreateOrderInput = {
        ...base,
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

  handleMidtransWebhook = async (payload: MidtransWebhookPayload) => {
    return this.tm.transaction(async (trx) => {
      // 0. CHECK EXISTING PAYMENT
      const existing = await this.orderPaymentsRepo.findByTransactionId(payload.transaction_id, trx);

      const isFirstTime = !existing;
      const isDuplicate = existing && existing.transaction_status === payload.transaction_status;
      const isProgression = existing && existing.transaction_status !== payload.transaction_status;

      // DUPLICATE → STOP
      if (isDuplicate) {
        return;
      }

      // 1. FIND ORDER
      const order = await this.repo.getOrderByCodeForUpdate(payload.order_id, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      // 2. INSERT PAYMENT (FIRST TIME / PROGRESSION)
      if (isFirstTime || isProgression) {
        const paymentInput = mapMidtransWebhookToPayment(payload, order.id);
        await this.orderPaymentsRepo.insertPayment(paymentInput, trx);
      }

      const status = payload.transaction_status;

      // 3. STATUS GUARD (don't overwrite if PAID)
      if (order.payment_status === "PAID") {
        return;
      }

      // 4. UPDATE ORDER STATUS

      // FINAL STATE
      if (status === "settlement") {
        await this.repo.markOrderPaid(order.id, trx);
        return;
      }

      // CREDIT CARD SAFE CASE
      if (status === "capture" && payload.fraud_status === "accept") {
        await this.repo.markOrderPaid(order.id, trx);
        return;
      }

      // EXPIRED
      if (status === "expire") {
        await this.repo.markOrderExpired(order.id, trx);
        return;
      }

      // FAILED
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
