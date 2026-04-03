import { TransactionManager } from "@/infra/db/transaction-manager";
import { AppError } from "@/errors/app-error";
import { GetOrdersQuery } from "./order.schema";
import { mapAdminOrder, mapAdminOrderDetail } from "./order.mapper";
import { assertOrderNotFinal, assertUpdated } from "@/shared/order/order.utils";
import { OrderAdminRepo } from "./order.admin.repo";
import { OrderRepo } from "@/modules/order/order.repo";

export class OrderService {
  constructor(
    private tm: TransactionManager,
    private readonly orderRepo: OrderRepo,
    private readonly orderAdminRepo: OrderAdminRepo
  ) {}

  getOrders = async (params: GetOrdersQuery) => {
    const [rows, total] = await Promise.all([this.orderAdminRepo.getOrders(params), this.orderAdminRepo.countOrders(params)]);

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
    const order = await this.orderAdminRepo.getOrderDetail(orderId);

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    const items = await this.orderAdminRepo.getOrderItems(orderId);

    return mapAdminOrderDetail(order, items);
  };

  markAsShipped = async (orderId: number, trackingNumber: string) => {
    return this.tm.transaction(async (trx) => {
      // 1. lock shipment
      const shipment = await this.orderRepo.getShipmentForUpdate(orderId, trx);

      if (!shipment) throw AppError.notFound("Shipment not found");

      // 2. validation
      if (shipment.status !== "PENDING") {
        throw AppError.badRequest("Already shipped");
      }

      const order = await this.orderRepo.getOrderForUpdate(orderId, trx);

      if (!order) throw AppError.notFound("Order not found");

      assertOrderNotFinal(order);

      if (order.payment_status !== "PAID") {
        throw AppError.badRequest("Order not paid");
      }

      // 3. update shipment
      const updated = await this.orderRepo.updateShipmentToShipped(
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
        await this.orderRepo.updateOrderToProcessing(orderId, trx);
      }
    });
  };

  markAsDelivered = async (orderId: number) => {
    return this.tm.transaction(async (trx) => {
      const shipment = await this.orderRepo.getShipmentForUpdate(orderId, trx);

      if (!shipment) throw AppError.notFound("Shipment not found");

      if (shipment.status !== "SHIPPED") {
        throw AppError.badRequest("Order not shipped yet");
      }

      const order = await this.orderRepo.getOrderForUpdate(orderId, trx);

      if (!order) throw AppError.notFound("Order not found");

      assertOrderNotFinal(order);

      const updated = await this.orderRepo.updateShipmentToDelivered(
        orderId,
        {
          deliveredAt: new Date()
        },
        trx
      );

      assertUpdated(updated, "Order not in shipped state");

      // important
      await this.orderRepo.updateOrderToCompleted(orderId, trx);
    });
  };
}
