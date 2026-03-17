import { TransactionManager } from "@/infra/db/transaction-manager";
import { OrdersRepo } from "./orders.repo";
import { AppError } from "@/errors/app-error";

export class OrdersService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly repo: OrdersRepo
  ) {}

  confirmCheckout = async (userId: number, sessionId: number) => {
    return this.tm.transaction(async (trx) => {
      // 1. GET SESSION
      const session = await this.repo.getCheckoutSessionForUpdate(sessionId, userId, trx);

      if (!session) {
        throw AppError.notFound("Checkout session not found");
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

      // 2. GET ITEMS + LOCK STOCK
      const items = await this.repo.getCheckoutItemsForUpdate(sessionId, trx);

      if (items.length === 0) {
        throw AppError.badRequest("No items");
      }

      // 3. VALIDATE ITEMS
      for (const item of items) {
        const productActive = item.product_status === "ACTIVE";
        const variantActive = item.variant_status === "ACTIVE";

        if (!productActive || !variantActive) {
          throw AppError.badRequest("Product unavailable");
        }

        if (item.quantity > item.stock) {
          throw AppError.badRequest("Insufficient stock");
        }
      }

      // 4. CREATE ORDER
      const orderId = await this.repo.createOrder(
        {
          userId,
          subtotal: session.subtotal,
          shippingCost: session.shipping_cost,
          total: session.total,

          recipientName: session.recipient_name,
          phone: session.phone,
          addressLine: session.address_line,
          provinceName: session.province_name,
          cityName: session.city_name,
          districtName: session.district_name,
          postalCode: session.postal_code,

          note: null
        },
        trx
      );

      // 5. INSERT ORDER ITEMS (SNAPSHOT)
      await this.repo.insertOrderItems(orderId, items, trx);

      // 6. INSERT SHIPMENT
      await this.repo.insertShipment(
        {
          orderId,
          courierCode: session.courier_code,
          courierName: session.courier_name,
          courierService: session.courier_service,
          shippingCost: session.shipping_cost,
          etd: session.shipping_etd
        },
        trx
      );

      // 7. REDUCE STOCK
      await this.repo.reduceStock(items, trx);

      // 8. DELETE SESSION (optional)
      await this.repo.deleteCheckoutSession(sessionId, userId, trx);

      return { orderId };
    });
  };
}
