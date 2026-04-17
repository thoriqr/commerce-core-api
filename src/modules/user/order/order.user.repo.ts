import { db } from "@/infra/db/knex";
import { GetOrdersByUserParams } from "./order.user.schema";
import {
  CreateOrderInput,
  InsertOrderItemInput,
  OrderByUser,
  OrderDetailRow,
  OrderForPaymentRow,
  OrderItemDetailRow,
  OrderItemForPaymentRow,
  ShipmentInput
} from "./order.user.types";
import { Knex } from "knex";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";

export class OrderUserRepo {
  getOrders = async (userId: number, params: GetOrdersByUserParams) => {
    const { page, limit, status } = params;

    const offset = (page - 1) * limit;

    // status filter mapping
    const filter = await this.buildUserOrderStatusFilter(status);

    const bindings = {
      userId,
      limit,
      offset,
      ...filter.bindings
    };

    const { rows } = await db.raw<{
      rows: OrderByUser[];
    }>(
      `
      WITH order_base AS (
        SELECT
          o.id,
          o.order_code,
          o.status,
          o.payment_status,
          o.total,
          o.created_at,
  
          os.status AS shipment_status
  
        FROM orders o
        JOIN order_shipments os ON os.order_id = o.id
  
        WHERE o.user_id = :userId
        ${filter.sql}
  
        ORDER BY o.created_at DESC
        LIMIT :limit OFFSET :offset
      ),
  
      item_count AS (
        SELECT
          oi.order_id,
          COUNT(*) AS item_count
        FROM order_items oi
        WHERE oi.order_id IN (SELECT id FROM order_base)
        GROUP BY oi.order_id
      ),
  
      preview_item AS (
        SELECT *
        FROM (
          SELECT
            oi.order_id,
            oi.product_id,
            oi.slug,
            oi.product_name,
            oi.image_key,
            ROW_NUMBER() OVER (PARTITION BY oi.order_id ORDER BY oi.id) as rn
          FROM order_items oi
          WHERE oi.order_id IN (SELECT id FROM order_base)
        ) t
        WHERE t.rn = 1
      )
  
      SELECT
        ob.id,
        ob.order_code,
        ob.status,
        ob.payment_status,
        ob.total,
        ob.created_at,
  
        ob.shipment_status,
  
        ic.item_count,

        pi.slug AS slug,
        pi.product_id AS product_id,
        pi.product_name AS preview_name,
        pi.image_key AS preview_image
  
      FROM order_base ob
      LEFT JOIN item_count ic ON ic.order_id = ob.id
      LEFT JOIN preview_item pi ON pi.order_id = ob.id
  
      ORDER BY ob.created_at DESC
      `,
      bindings
    );

    return rows;
  };

  countOrders = async (userId: number, status?: "ongoing" | "completed" | "cancelled") => {
    const filter = await this.buildUserOrderStatusFilter(status);

    const bindings = {
      userId,
      ...filter.bindings
    };

    const { rows } = await db.raw<{
      rows: Array<{ total: number }>;
    }>(
      `
      SELECT COUNT(*)::int AS total
      FROM orders o
      WHERE o.user_id = :userId
      ${filter.sql}
      `,
      bindings
    );

    return rows[0]?.total ?? 0;
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
        o.*,
  
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

  private async buildUserOrderStatusFilter(status?: GetOrdersByUserParams["status"]) {
    if (!status) {
      return { sql: "", bindings: {} };
    }

    if (status === "ongoing") {
      return {
        sql: `
      AND (
        -- waiting payment
        (o.status = 'PENDING' AND o.payment_status = 'UNPAID')

        -- paid but not processed yet
        OR (o.status = 'PENDING' AND o.payment_status = 'PAID')

        -- processing
        OR o.status = 'PROCESSING'
      )
    `,
        bindings: {}
      };
    }

    if (status === "completed") {
      return {
        sql: `AND o.status = 'COMPLETED'`,
        bindings: {}
      };
    }

    if (status === "cancelled") {
      return {
        sql: `
        AND (
          o.status = 'CANCELLED'
          OR o.payment_status IN ('FAILED', 'EXPIRED')
        )
      `,
        bindings: {}
      };
    }

    return { sql: "", bindings: {} };
  }
}
