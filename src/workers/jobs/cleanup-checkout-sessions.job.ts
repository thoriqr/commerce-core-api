import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupCheckoutSessionsJob = {
  name: JOB_NAMES.CLEANUP_CHECKOUT_SESSIONS,

  async handler() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      DELETE FROM checkout_sessions
      WHERE id IN (
        SELECT id
      FROM checkout_sessions
        WHERE
          (
            converted_at IS NULL
            AND expires_at < NOW()
          )
          OR (
            converted_at IS NOT NULL
            AND converted_at < NOW() - INTERVAL '1 hour'
          )
          OR (
            revoked_at IS NOT NULL
            AND revoked_at < NOW() - INTERVAL '1 hour'
          )
        LIMIT 500
      )
      RETURNING id;
    `);

    if (rows.length > 0) {
      console.log(`[cleanup] deleted ${rows.length} Checkout sessions`);
    }

    return rows.length;
  }
};
