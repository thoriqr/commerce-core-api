import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const autoCompleteDeliveredOrdersJob = {
  name: JOB_NAMES.AUTO_COMPLETE_DELIVERED_ORDERS,

  async handler() {
    const start = Date.now();

    try {
      const result = await db.transaction(async (trx) => {
        // 1. Select eligible orders with lock
        const { rows } = await trx.raw<{
          rows: { order_id: number }[];
        }>(`
          SELECT os.order_id
          FROM order_shipments os
          JOIN orders o ON o.id = os.order_id
          WHERE
            os.status = 'SHIPPED'
            AND os.shipped_at IS NOT NULL
            AND os.shipped_at < NOW() - INTERVAL '14 days'

            AND o.payment_status = 'PAID'
            AND o.status NOT IN ('CANCELLED', 'COMPLETED')
            
          ORDER BY os.shipped_at ASC
          LIMIT 200
        `);

        if (rows.length === 0) {
          return 0;
        }

        const orderIds = rows.map((r) => r.order_id);

        // 2. Update shipment → DELIVERED
        await trx.raw(
          `
          UPDATE order_shipments
          SET
            status = 'DELIVERED',
            delivered_at = NOW(),
            updated_at = NOW()
          WHERE order_id = ANY(:orderIds)
            AND status = 'SHIPPED'
          `,
          { orderIds }
        );

        // 3. Update orders → COMPLETED
        await trx.raw(
          `
          UPDATE orders
          SET
            status = 'COMPLETED',
            completed_at = NOW(),
            updated_at = NOW()
          WHERE id = ANY(:orderIds)
            AND status != 'COMPLETED'
            AND status != 'CANCELLED'
          `,
          { orderIds }
        );

        return orderIds.length;
      });

      const duration = Date.now() - start;

      if (result > 0) {
        logger.info("Auto complete delivered orders", {
          jobName: JOB_NAMES.AUTO_COMPLETE_DELIVERED_ORDERS,
          affected: result,
          duration
        });
      }

      return result;
    } catch (error) {
      logger.error("Auto complete delivered orders failed", {
        jobName: JOB_NAMES.AUTO_COMPLETE_DELIVERED_ORDERS,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }
};
