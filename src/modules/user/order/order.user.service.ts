import { TransactionManager } from "@/infra/db/transaction-manager";
import { mapOrder, mapOrdersByUser, mapSessionToCreateOrderInput } from "./order.user.mapper";
import { OrderUserRepo } from "./order.user.repo";
import { GetOrdersByUserParams } from "./order.user.schema";
import { AppError } from "@/errors/app-error";
import { assertOrderNotFinal } from "@/shared/order/order.utils";
import { OrderRepo } from "@/modules/order/order.repo";
import { buildMidtransPayload } from "@/modules/payment/midtrans/midtrans.builder";
import { createSnapTransaction } from "@/modules/payment/midtrans/midtrans.client";

export class OrderUserService {
  constructor(
    private tm: TransactionManager,
    private readonly orderRepo: OrderRepo,
    private readonly orderUserRepo: OrderUserRepo
  ) {}

  getOrder = async (userId: number, orderCode: string) => {
    const order = await this.orderUserRepo.getOrderByCodeDetail(orderCode, userId);

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    const items = await this.orderUserRepo.getOrderItemsDetail(order.id);

    // optional safety
    if (items.length === 0) {
      throw AppError.badRequest("Order has no items");
    }

    // mapping → DTO
    return mapOrder(order, items);
  };

  getOrders = async (userId: number, qParams: GetOrdersByUserParams) => {
    const [rows, total] = await Promise.all([this.orderUserRepo.getOrders(userId, qParams), this.orderUserRepo.countOrders(userId, qParams.status)]);

    const data = {
      items: rows.map(mapOrdersByUser),
      meta: {
        page: qParams.page,
        limit: qParams.limit,
        total,
        totalPages: Math.ceil(total / qParams.limit),
        hasNext: qParams.page * qParams.limit < total,
        hasPrev: qParams.page > 1
      }
    };

    return data;
  };

  cancelOrder = async (userId: number, orderCode: string) => {
    return this.tm.transaction(async (trx) => {
      const order = await this.orderRepo.getOrderByCodeForUpdate(orderCode, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      if (order.user_id !== userId) {
        throw AppError.forbidden();
      }

      assertOrderNotFinal(order);

      if (order.payment_status === "PAID") {
        throw AppError.badRequest("Order already paid");
      }

      if (order.status === "CANCELLED" || order.status === "COMPLETED") {
        return; // idempotent / ignore
      }

      await this.orderRepo.markOrderCancelled(order.id, trx);
    });
  };

  confirmOrderDelivered = async (userId: number, orderCode: string) => {
    return this.tm.transaction(async (trx) => {
      const order = await this.orderRepo.getOrderByCodeForUpdate(orderCode, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      if (order.user_id !== userId) {
        throw AppError.forbidden();
      }

      assertOrderNotFinal(order);

      const shipment = await this.orderRepo.getShipmentForUpdate(order.id, trx);

      if (!shipment) {
        throw AppError.notFound("Shipment not found");
      }

      // idempotent check
      if (shipment.status === "DELIVERED") {
        return;
      }

      if (shipment.status !== "SHIPPED") {
        throw AppError.badRequest("Order not in shipped state");
      }

      await this.orderRepo.updateShipmentToDelivered(
        order.id,
        {
          deliveredAt: new Date()
        },
        trx
      );

      await this.orderRepo.updateOrderToCompleted(order.id, trx);
    });
  };

  createSnapToken = async (userId: number, orderCode: string) => {
    return this.tm.transaction(async (trx) => {
      const order = await this.orderUserRepo.getOrderForPaymentForUpdate(orderCode, userId, trx);

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

      // REUSE TOKEN
      if (order.snap_token) {
        return {
          token: order.snap_token,
          redirect_url: order.snap_redirect_url
        };
      }

      const items = await this.orderUserRepo.getOrderItems(order.id, trx);

      const payload = buildMidtransPayload(order, items);

      const result = await createSnapTransaction(payload);

      // SAVE TOKEN
      await this.orderUserRepo.saveSnapToken(order.id, result.token, result.redirect_url, trx);

      return {
        token: result.token,
        redirect_url: result.redirect_url
      };
    });
  };
}
