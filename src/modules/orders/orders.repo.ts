import { Knex } from "knex";
import {
  CreateOrderInput,
  InsertOrderItemInput,
  OrderDetailRow,
  OrderForPaymentRow,
  OrderItemDetailRow,
  OrderItemForPaymentRow,
  ShipmentInput
} from "./orders.types";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";

export class OrdersRepo {
  createOrder = async (input: CreateOrderInput, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: { id: number; order_code: string }[] }>(
      `
    INSERT INTO orders (
      user_id,
      email,
      order_code,
      subtotal,
      shipping_cost,
      total,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      postal_code,
      note,
      expires_at
    )
    VALUES (
      :userId,
      :email,
      :orderCode,
      :subtotal,
      :shippingCost,
      :total,
      :recipientName,
      :phone,
      :addressLine,
      :provinceName,
      :cityName,
      :districtName,
      :postalCode,
      :note,
      :expiresAt
    )
    RETURNING id, order_code
    `,
      input
    );

    const row = rows[0];

    if (!row) {
      logger.error("insert orders returning no rows");
      throw AppError.internal();
    }

    return row;
  };

  insertOrderItems = async (orderId: number, items: InsertOrderItemInput[], trx: Knex.Transaction) => {
    const values = items
      .map(
        (_, i) =>
          `(:orderId, :variantId${i}, :productId${i}, :productName${i}, :slug${i}, :price${i}, :qty${i}, :weight${i}, :imageId${i}, :imageKey${i}, :optionSnapshot${i})`
      )
      .join(",");

    const bindings: any = { orderId };

    items.forEach((item, i) => {
      bindings[`variantId${i}`] = item.variant_id;
      bindings[`productId${i}`] = item.product_id;
      bindings[`productName${i}`] = item.product_name;
      bindings[`slug${i}`] = item.slug;
      bindings[`price${i}`] = item.price;
      bindings[`qty${i}`] = item.quantity;
      bindings[`weight${i}`] = item.weight;

      bindings[`imageId${i}`] = item.image_id;
      bindings[`imageKey${i}`] = item.image_key;

      bindings[`optionSnapshot${i}`] = JSON.stringify(item.option_snapshot ?? []);
    });

    await trx.raw(
      `
    INSERT INTO order_items (
      order_id,
      variant_id,
      product_id,
      product_name,
      slug,
      price,
      quantity,
      weight,
      image_id,
      image_key,
      option_snapshot
    )
    VALUES ${values}
    `,
      bindings
    );
  };

  insertShipment = async (input: ShipmentInput, trx: Knex.Transaction) => {
    await trx.raw(
      `
    INSERT INTO order_shipments (
      order_id,
      courier_code,
      courier_name,
      courier_service,
      courier_description,
      shipping_etd
    )
    VALUES (
      :orderId,
      :courierCode,
      :courierName,
      :courierService,
      :courierDescription,
      :shippingEtd
    )
    `,
      input
    );
  };

  getOrderByCodeForUpdate = async (orderCode: string, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: { id: number; payment_status: string; user_id: number; status: string }[];
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

  getOrderItems = async (orderId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: OrderItemForPaymentRow[] }>(
      `
    SELECT
      product_id,
      product_name,
      price,
      quantity,
      option_snapshot
    FROM order_items
    WHERE order_id = :orderId
    `,
      { orderId }
    );

    return rows;
  };

  getOrderByCodeDetail = async (orderCode: string, userId: number) => {
    const { rows } = await db.raw<{
      rows: OrderDetailRow[];
    }>(
      `
    SELECT
      o.id,
      o.order_code,
      o.total,
      o.subtotal,
      o.shipping_cost,
      o.payment_status,
      o.status,
      o.cancelled_at,
      o.expires_at,
      o.paid_at,

      o.recipient_name,
      o.phone,
      o.address_line,
      o.province_name,
      o.city_name,
      o.district_name,
      o.postal_code,

      os.courier_code,
      os.courier_name,
      os.courier_service,
      os.courier_description,
      os.shipping_etd,
      os.tracking_number,
      os.status AS shipment_status,
      os.shipped_at,
      os.delivered_at

    FROM orders o
    JOIN order_shipments os ON os.order_id = o.id

    WHERE o.order_code = :orderCode
    AND o.user_id = :userId
    LIMIT 1
    `,
      { orderCode, userId }
    );

    return rows[0] ?? null;
  };

  getOrderItemsDetail = async (orderId: number) => {
    const { rows } = await db.raw<{
      rows: OrderItemDetailRow[];
    }>(
      `
    SELECT
      product_id,
      variant_id,
      product_name,
      slug,
      price,
      quantity,
      weight,
      image_key,
      image_id,
      option_snapshot
    FROM order_items
    WHERE order_id = :orderId
    `,
      { orderId }
    );

    return rows;
  };

  getOrderForPaymentForUpdate = async (orderCode: string, userId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: OrderForPaymentRow[] }>(
      `
    SELECT
      id,
      email,
      recipient_name,
      city_name,
      address_line,
      postal_code,
      order_code,
      total,
      shipping_cost,
      payment_status,
      expires_at,
      status,
      phone,
      snap_token,
      snap_redirect_url
    FROM orders
    WHERE order_code = :orderCode
    AND user_id = :userId
    FOR UPDATE
    `,
      { orderCode, userId }
    );

    return rows[0] ?? null;
  };

  saveSnapToken = async (orderId: number, token: string, redirectUrl: string, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE orders
    SET
      snap_token = :token,
      snap_redirect_url = :redirectUrl
    WHERE id = :orderId
    `,
      {
        orderId,
        token,
        redirectUrl
      }
    );
  };
}
