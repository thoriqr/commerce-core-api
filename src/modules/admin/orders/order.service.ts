import { TransactionManager } from "@/infra/db/transaction-manager";
import { OrderRepo } from "./order.repo";
import { AppError } from "@/errors/app-error";
import { assertOrderActive, assertUpdated } from "./order.util";
import { GetOrdersQuery } from "./order.schema";
import { mapAdminOrder, mapAdminOrderDetail } from "./order.mapper";

export class OrderService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: OrderRepo
  ) {}

  getOrders = async (params: GetOrdersQuery) => {
    const [rows, total] = await Promise.all([this.repo.getOrders(params), this.repo.countOrders(params)]);

    return {
      data: rows.map(mapAdminOrder),
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasNext: params.page * params.limit < total,
        hasPrev: params.page > 1
      }
    };
  };

  getOrder = async (orderId: number) => {
    const order = await this.repo.getOrderDetail(orderId);

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    const items = await this.repo.getOrderItems(orderId);

    return mapAdminOrderDetail(order, items);
  };

  markAsShipped = async (orderId: number, trackingNumber: string) => {
    return this.tm.transaction(async (trx) => {
      // 1. lock shipment
      const shipment = await this.repo.getShipmentForUpdate(orderId, trx);

      if (!shipment) throw AppError.notFound("Shipment not found");

      // 2. validation
      if (shipment.status !== "PENDING") {
        throw AppError.badRequest("Already shipped");
      }

      const order = await this.repo.getOrderForUpdate(orderId, trx);

      if (!order) throw AppError.notFound("Order not found");

      assertOrderActive(order);

      if (order.payment_status !== "PAID") {
        throw AppError.badRequest("Order not paid");
      }

      // 3. update shipment
      const updated = await this.repo.updateShipmentToShipped(
        orderId,
        {
          trackingNumber,
          shippedAt: new Date()
        },
        trx
      );

      assertUpdated(updated, "Shipment already processed or invalid state");

      // 4. update order
      if (order.status === "PENDING") {
        await this.repo.updateOrderToProcessing(orderId, trx);
      }
    });
  };

  markAsDelivered = async (orderId: number) => {
    return this.tm.transaction(async (trx) => {
      const shipment = await this.repo.getShipmentForUpdate(orderId, trx);

      if (!shipment) throw AppError.notFound("Shipment not found");

      if (shipment.status !== "SHIPPED") {
        throw AppError.badRequest("Order not shipped yet");
      }

      const order = await this.repo.getOrderForUpdate(orderId, trx);

      if (!order) throw AppError.notFound("Order not found");

      assertOrderActive(order);

      const updated = await this.repo.updateShipmentToDelivered(
        orderId,
        {
          deliveredAt: new Date()
        },
        trx
      );

      assertUpdated(updated, "Order not in shipped state");

      // important
      await this.repo.updateOrderToCompleted(orderId, trx);
    });
  };
}
