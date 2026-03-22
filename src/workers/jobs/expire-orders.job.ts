import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const expireOrdersJob = {
  name: JOB_NAMES.EXPIRE_ORDERS,

  async handler() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      UPDATE orders
      SET
        payment_status = 'EXPIRED',
        status = 'CANCELLED',
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id IN (
        SELECT id
        FROM orders
        WHERE
          payment_status = 'UNPAID'
          AND expires_at < NOW()
        LIMIT 500
      )
      RETURNING id
    `);

    console.log(`Expire orders: updated ${rows.length}`);

    return rows.length;
  }
};
