import { db } from "@/infra/db/knex";

export class DashboardRepo {
  getSummary = async (from?: Date, to?: Date) => {
    const conditions: string[] = [`payment_status = 'PAID'`];
    const bindings: Record<string, any> = {};

    if (from) {
      conditions.push(`created_at >= :from`);
      bindings.from = from;
    }

    if (to) {
      conditions.push(`created_at < :to`);
      bindings.to = to;
    }

    const { rows } = await db.raw<{
      rows: { total_orders: number; total_revenue: string }[];
    }>(
      `
    SELECT
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(total), 0)::bigint AS total_revenue
    FROM orders
    WHERE ${conditions.join(" AND ")}
  `,
      bindings
    );

    return (
      rows[0] ?? {
        total_orders: 0,
        total_revenue: "0"
      }
    );
  };

  getRevenueChart = async (from?: Date, to?: Date) => {
    const conditions: string[] = [`payment_status = 'PAID'`];
    const bindings: Record<string, any> = {};

    if (from) {
      conditions.push(`created_at >= :from`);
      bindings.from = from;
    }

    if (to) {
      conditions.push(`created_at < :to`);
      bindings.to = to;
    }

    const { rows } = await db.raw<{
      rows: { month: string; revenue: string }[];
    }>(
      `
    SELECT
      TO_CHAR(
        DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Jakarta'),
        'YYYY-MM'
      ) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue
    FROM orders
    WHERE ${conditions.join(" AND ")}
    GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Jakarta')
    ORDER BY DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Jakarta') ASC
  `,
      bindings
    );

    return rows;
  };

  getOrdersChart = async (from?: Date, to?: Date) => {
    const conditions: string[] = [`payment_status = 'PAID'`];
    const bindings: Record<string, any> = {};

    if (from) {
      conditions.push(`created_at >= :from`);
      bindings.from = from;
    }

    if (to) {
      conditions.push(`created_at < :to`);
      bindings.to = to;
    }

    const { rows } = await db.raw<{
      rows: { date: string; orders: number }[];
    }>(
      `
    SELECT
      TO_CHAR(
        DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Jakarta'),
        'YYYY-MM-DD'
      ) AS date,
      COUNT(*)::int AS orders
    FROM orders
    WHERE ${conditions.join(" AND ")}
    GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Jakarta')
    ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Jakarta') ASC
  `,
      bindings
    );

    return rows;
  };

  getBestSelling = async (limit: number = 5) => {
    const { rows } = await db.raw<{
      rows: {
        id: number;
        name: string;
        sold: number;
      }[];
    }>(
      `
    SELECT
      pv.id,
      p.name,
      pv.sold
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.sold > 0
    ORDER BY pv.sold DESC
    LIMIT :limit
  `,
      { limit }
    );

    return rows;
  };

  getRecentOrders = async (limit: number = 5) => {
    const { rows } = await db.raw<{
      rows: {
        order_code: string;
        total: string;
        status: string;
        payment_status: string;
        created_at: Date;
        recipient_name: string;
      }[];
    }>(
      `
    SELECT
      order_code,
      total,
      status,
      payment_status,
      created_at,
      recipient_name
    FROM orders
    ORDER BY created_at DESC
    LIMIT :limit
  `,
      { limit }
    );

    return rows;
  };
}
