import { Knex } from "knex";
import { OrderPaymentStatus, OrderShipmentStatus, OrderStatus } from "@/shared/order/order.types";

export class OrderRepo {
  getOrderByCodeForUpdate = async (orderCode: string, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: { id: number; payment_status: OrderPaymentStatus; user_id: number; status: OrderStatus }[];
    }>(
      `
    SELECT id, payment_status, user_id, status
    FROM orders
    WHERE order_code = :orderCode
    FOR UPDATE
    `,
      { orderCode }
    );

    return rows[0] ?? null;
  };

  getOrderForUpdate = async (orderId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: Array<{
        id: number;
        status: OrderStatus;
        payment_status: OrderPaymentStatus;
      }>;
    }>(
      `
    SELECT
      id,
      status,
      payment_status
    FROM orders
    WHERE id = :orderId
    FOR UPDATE
    `,
      { orderId }
    );

    return rows[0] ?? null;
  };

  markOrderPaid = async (orderId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE orders
    SET 
      payment_status = 'PAID',
      paid_at = NOW()
    WHERE id = :orderId
    `,
      { orderId }
    );
  };

  markOrderExpired = async (orderId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE orders
    SET 
      payment_status = 'EXPIRED'
    WHERE id = :orderId
    `,
      { orderId }
    );
  };

  markOrderFailed = async (orderId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE orders
    SET 
      payment_status = 'FAILED'
    WHERE id = :orderId
    `,
      { orderId }
    );
  };

  markOrderCancelled = async (orderId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE orders
    SET
      status = 'CANCELLED',
      payment_status = 'FAILED',
      cancelled_at = NOW()
    WHERE id = :orderId
  `,
      { orderId }
    );
  };

  getShipmentForUpdate = async (orderId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: Array<{
        id: number;
        order_id: number;
        status: OrderShipmentStatus;
        tracking_number: string | null;
      }>;
    }>(
      `
      SELECT
        id,
        order_id,
        status,
        tracking_number
      FROM order_shipments
      WHERE order_id = :orderId
      FOR UPDATE
      `,
      { orderId }
    );

    return rows[0] ?? null;
  };

  updateShipmentToShipped = async (orderId: number, data: { trackingNumber: string; shippedAt: Date }, trx: Knex.Transaction) => {
    const result = await trx.raw<{ rowCount: number }>(
      `
    UPDATE order_shipments
    SET
      tracking_number = :trackingNumber,
      status = 'SHIPPED',
      shipped_at = :shippedAt
    WHERE order_id = :orderId
      AND status = 'PENDING'
    `,
      {
        orderId,
        trackingNumber: data.trackingNumber,
        shippedAt: data.shippedAt
      }
    );

    return result.rowCount ?? 0;
  };

  updateShipmentToDelivered = async (orderId: number, data: { deliveredAt: Date }, trx: Knex.Transaction) => {
    const result = await trx.raw<{ rowCount: number }>(
      `
    UPDATE order_shipments
    SET
      status = 'DELIVERED',
      delivered_at = :deliveredAt
    WHERE order_id = :orderId
      AND status = 'SHIPPED'
    `,
      {
        orderId,
        deliveredAt: data.deliveredAt
      }
    );

    return result.rowCount ?? 0;
  };

  updateOrderToProcessing = async (orderId: number, trx: Knex.Transaction) => {
    const result = await trx.raw<{ rowCount: number }>(
      `
    UPDATE orders
    SET
      status = 'PROCESSING'
    WHERE id = :orderId
      AND status = 'PENDING'
    `,
      { orderId }
    );

    return result.rowCount ?? 0;
  };

  updateOrderToCompleted = async (orderId: number, trx: Knex.Transaction) => {
    const result = await trx.raw<{ rowCount: number }>(
      `
    UPDATE orders
    SET
      status = 'COMPLETED'
    WHERE id = :orderId
      AND status != 'COMPLETED'
      AND status != 'CANCELLED'
    `,
      { orderId }
    );
    return result.rowCount ?? 0;
  };
}
