import { TransactionManager } from "@/infra/db/transaction-manager";
import { OrdersRepo } from "./orders.repo";
import { AppError } from "@/errors/app-error";
import { assertCheckoutReady, assertItemsValid } from "./orders.util";
import { ProductImageService } from "../product/product-image.service";
import { CheckoutSessionItemRow } from "./orders.types";
import { findBestImage } from "@/shared/variant-image/resolver";
import { mapSessionToCreateOrderInput } from "./orders.mapper";

export class OrdersService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly repo: OrdersRepo,
    private readonly productImageService: ProductImageService
  ) {}

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

      const input = {
        ...mapSessionToCreateOrderInput(session, userId),
        expiresAt
      };

      // 7. CREATE ORDER
      const orderId = await this.repo.createOrder(input, trx);

      // 8. INSERT ITEMS
      await this.repo.insertOrderItems(orderId, enrichedItems, trx);

      // 9. SHIPMENT
      await this.repo.insertShipment(
        {
          orderId,
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

      return { orderId };
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
