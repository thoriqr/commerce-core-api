import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupAbandonedGuestCartsJob = {
  name: JOB_NAMES.CLEANUP_ABANDONED_GUEST_CARTS,

  async handler() {
    const { rows } = await db.raw<{
      rows: { id: string }[];
    }>(`
      DELETE FROM carts
      WHERE id IN (
        SELECT id
        FROM carts
        WHERE user_id IS NULL
          AND updated_at < NOW() - INTERVAL '7 days'
        LIMIT 500
      )
      RETURNING id
    `);

    console.log(`Cleanup abandoned carts: deleted ${rows.length}`);

    return rows.length;
  }
};
