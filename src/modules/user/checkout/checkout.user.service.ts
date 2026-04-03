import { TransactionManager } from "@/infra/db/transaction-manager";
import { CheckoutUserRepo } from "./checkout.user.repo";
import { CheckoutRepo } from "@/modules/checkout/checkout.repo";
import { AppError } from "@/errors/app-error";
import { assertCheckoutReady, assertItemsValid } from "./checkout.user.utils";
import { CheckoutSessionItemRow } from "@/modules/checkout/checkout.types";
import { ProductImageService } from "@/modules/product/product-image.service";
import { findBestImage } from "@/shared/variant-image/resolver";
import { UserRepo } from "../user.repo";
import { generateOrderCode } from "../orders/order.user.utils";
import { mapSessionToCreateOrderInput } from "../orders/order.user.mapper";
import { OrderUserRepo } from "../orders/order.user.repo";
import { ProductStockRepo } from "@/modules/product/product-stock.repo";

export class CheckoutUserService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly userRepo: UserRepo,
    private readonly orderUserRepo: OrderUserRepo,
    private readonly checkoutUserRepo: CheckoutUserRepo,
    private readonly checkoutRepo: CheckoutRepo,
    private readonly productStockRepo: ProductStockRepo,
    private readonly productImageService: ProductImageService
  ) {}

  confirmCheckout = async (userId: number, sessionId: number) => {
    return this.tm.transaction(async (trx) => {
      // 1. GET SESSION
      const session = await this.checkoutRepo.getCheckoutSessionForUpdate(sessionId, userId, trx);

      if (!session) {
        throw AppError.badRequest("Session already used or invalid");
      }

      if (session.expires_at < new Date()) {
        throw AppError.badRequest("Checkout session expired");
      }

      assertCheckoutReady(session);

      // 2. GET ITEMS + LOCK STOCK
      const items = await this.checkoutRepo.getCheckoutSessionItemsForUpdate(sessionId, trx);

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
      await this.checkoutRepo.markSessionConverted(sessionId, trx);

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const base = mapSessionToCreateOrderInput(session, userId);

      const input = {
        ...base,
        email: user.email,
        expiresAt,
        orderCode: generateOrderCode()
      };

      // 7. CREATE ORDER
      const order = await this.orderUserRepo.createOrder(input, trx);

      // 8. INSERT ITEMS
      await this.orderUserRepo.insertOrderItems(order.id, enrichedItems, trx);

      // 9. SHIPMENT
      await this.orderUserRepo.insertShipment(
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
      await this.productStockRepo.reduceStock(items, trx);

      return order.order_code;
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
