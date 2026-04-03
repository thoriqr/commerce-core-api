import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupPendingVerificationsJob = {
  name: JOB_NAMES.CLEANUP_PENDING_VERIFICATIONS,

  async handler() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      DELETE FROM pending_verifications
      WHERE id IN (
        SELECT id
        FROM pending_verifications
        WHERE used_at IS NULL
          AND expires_at < NOW()
        LIMIT 500
      )
      RETURNING id
    `);

    if (rows.length > 0) {
      console.log(`[cleanup] deleted ${rows.length} Pending verifications`);
    }

    return rows.length;
  }
};
