import { GetOrdersQuery } from "./order.schema";
import { db } from "@/infra/db/knex";
import { OrderDetailRow, OrderItemRow, OrderListingRow } from "./order.types";

export class OrderAdminRepo {
  getOrders = async (params: GetOrdersQuery) => {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const filter = this.buildOrderFilter(params);

    const bindings = {
      limit,
      offset,
      ...filter.bindings
    };

    const whereSql = filter.where.length ? `WHERE ${filter.where.join(" AND ")}` : "";

    const { rows } = await db.raw<{
      rows: OrderListingRow[];
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

        CASE
        WHEN o.payment_status = 'PAID'
          AND EXISTS (
            SELECT 1 FROM order_shipments os
            WHERE os.order_id = o.id
            AND os.status = 'PENDING'
          ) THEN 0 -- READY_TO_SHIP

        WHEN o.payment_status = 'UNPAID' THEN 1 -- WAITING_PAYMENT

        WHEN EXISTS (
          SELECT 1 FROM order_shipments os
          WHERE os.order_id = o.id
          AND os.status = 'SHIPPED'
        ) THEN 2 -- SHIPPED

        WHEN o.status = 'COMPLETED' THEN 3

        WHEN o.status = 'CANCELLED' THEN 4

        WHEN o.payment_status = 'FAILED' THEN 5

        WHEN o.payment_status = 'EXPIRED' THEN 6

        ELSE 99
      END AS priority

      FROM orders o
      ${whereSql}
      ORDER BY priority ASC, o.created_at DESC
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
          oi.product_name,
          oi.image_key,
          ROW_NUMBER() OVER (
            PARTITION BY oi.order_id
            ORDER BY oi.id
          ) AS rn
        FROM order_items oi
        WHERE oi.order_id IN (SELECT id FROM order_base)
      ) t
      WHERE t.rn = 1
    ),

    shipment AS (
      SELECT
        os.order_id,
        os.status AS shipment_status
      FROM order_shipments os
      WHERE os.order_id IN (SELECT id FROM order_base)
    )

    SELECT
      ob.id,
      ob.order_code,
      ob.status,
      ob.payment_status,
      ob.total,
      ob.created_at,

      s.shipment_status,

      ic.item_count,

      pi.product_name AS preview_name,
      pi.image_key AS preview_image

    FROM order_base ob
    LEFT JOIN item_count ic ON ic.order_id = ob.id
    LEFT JOIN preview_item pi ON pi.order_id = ob.id
    INNER JOIN shipment s ON s.order_id = ob.id

    ORDER BY ob.priority ASC, ob.created_at DESC
    `,
      bindings
    );

    return rows;
  };

  getOrderDetail = async (orderId: number) => {
    const { rows } = await db.raw<{
      rows: OrderDetailRow[];
    }>(
      `
    SELECT
      o.*,

      -- shipment (guaranteed → JOIN)
      os.courier_name,
      os.courier_service,
      os.tracking_number,
      os.status AS shipment_status,
      os.shipped_at,
      os.delivered_at,

      -- latest payment (optional → LEFT JOIN LATERAL)
      op.transaction_status AS payment_status_midtrans,
      op.payment_type,
      op.bank,
      op.payment_code,
      op.transaction_time,
      op.settlement_time

    FROM orders o

    JOIN order_shipments os
      ON os.order_id = o.id

    LEFT JOIN LATERAL (
      SELECT
        transaction_status,
        payment_type,
        bank,
        payment_code,
        transaction_time,
        settlement_time
      FROM order_payments op
      WHERE op.order_id = o.id
      ORDER BY op.created_at DESC
      LIMIT 1
    ) op ON true

    WHERE o.id = :orderId
    LIMIT 1
    `,
      { orderId }
    );

    return rows[0] ?? null;
  };

  getOrderItems = async (orderId: number) => {
    const { rows } = await db.raw<{
      rows: OrderItemRow[];
    }>(
      `
    SELECT
      product_id,
      product_name,
      quantity,
      slug,
      price,
      image_key,
      option_snapshot
    FROM order_items
    WHERE order_id = :orderId
    `,
      { orderId }
    );

    return rows;
  };

  countOrders = async (params: GetOrdersQuery) => {
    const filter = this.buildOrderFilter(params);

    const bindings = {
      ...filter.bindings
    };

    const whereSql = filter.where.length ? `WHERE ${filter.where.join(" AND ")}` : "";

    const { rows } = await db.raw<{
      rows: Array<{ total: number }>;
    }>(
      `
    SELECT COUNT(*)::int AS total
    FROM orders o
    ${whereSql}
    `,
      bindings
    );

    return rows[0]?.total ?? 0;
  };

  private buildOrderFilter(params: GetOrdersQuery) {
    const where: string[] = [];
    const bindings: Record<string, any> = {};

    /**
     * ADMIN STATUS FILTER
     */
    if (params.status) {
      switch (params.status) {
        case "WAITING_PAYMENT":
          where.push(`o.payment_status = 'UNPAID'`);
          break;

        case "READY_TO_SHIP":
          where.push(`o.payment_status = 'PAID'`);
          where.push(`
          EXISTS (
            SELECT 1 FROM order_shipments os
            WHERE os.order_id = o.id
            AND os.status = 'PENDING'
          )
        `);
          break;

        case "SHIPPED":
          where.push(`
          EXISTS (
            SELECT 1 FROM order_shipments os
            WHERE os.order_id = o.id
            AND os.status = 'SHIPPED'
          )
        `);
          break;

        case "COMPLETED":
          where.push(`o.status = 'COMPLETED'`);
          break;

        case "CANCELLED":
          where.push(`o.status = 'CANCELLED'`);
          break;

        case "FAILED":
          where.push(`o.payment_status = 'FAILED'`);
          break;

        case "EXPIRED":
          where.push(`o.payment_status = 'EXPIRED'`);
          break;
      }
    }

    /**
     * PAYMENT FILTER
     */
    if (params.paymentStatus) {
      where.push(`o.payment_status = :paymentStatus`);
      bindings.paymentStatus = params.paymentStatus;
    }

    /**
     * SEARCH
     */
    if (params.search) {
      where.push(`o.order_code ILIKE :search`);
      bindings.search = `%${params.search}%`;
    }

    /**
     * DATE RANGE
     */
    if (params.createdFrom) {
      where.push(`o.created_at >= :createdFrom`);
      bindings.createdFrom = params.createdFrom;
    }

    if (params.createdTo) {
      where.push(`o.created_at <= :createdTo`);
      bindings.createdTo = params.createdTo;
    }

    return { where, bindings };
  }
}
