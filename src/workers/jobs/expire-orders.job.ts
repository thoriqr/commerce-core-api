import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const expireOrdersJob = {
  name: JOB_NAMES.EXPIRE_ORDERS,

  async handler() {
    const start = Date.now();

    try {
      const result = await db.transaction(async (trx) => {
        // 1. Select expired unpaid orders with row-level lock
        const { rows } = await trx.raw<{
          rows: { id: number }[];
        }>(`
          SELECT id
          FROM orders
          WHERE
            payment_status = 'UNPAID'
            AND status = 'PENDING'
            AND expires_at < NOW()
          LIMIT 500
        `);

        if (rows.length === 0) {
          return 0;
        }

        const orderIds = rows.map((r) => r.id);

        // 2. Release stock
        await trx.raw(
          `
          UPDATE product_variants pv
          SET stock = pv.stock + oi.total_qty
          FROM (
            SELECT variant_id, SUM(quantity) AS total_qty
            FROM order_items
            WHERE order_id = ANY(:orderIds)
            GROUP BY variant_id
          ) oi
          WHERE pv.id = oi.variant_id
          `,
          { orderIds }
        );

        // 3. Update orders
        await trx.raw(
          `
          UPDATE orders
          SET
            payment_status = 'EXPIRED',
            status = 'CANCELLED',
            cancelled_at = NOW(),
            updated_at = NOW()
          WHERE id = ANY(:orderIds)
          `,
          { orderIds }
        );

        return orderIds.length;
      });

      const duration = Date.now() - start;

      if (result > 0) {
        logger.info("Expire orders", {
          jobName: JOB_NAMES.EXPIRE_ORDERS,
          affected: result,
          duration
        });
      }

      return result;
    } catch (error) {
      logger.error("Expire orders failed", {
        jobName: JOB_NAMES.EXPIRE_ORDERS,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }
};
