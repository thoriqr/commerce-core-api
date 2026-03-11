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
      WHERE used_at IS NOT NULL
         OR expires_at < NOW()
      LIMIT 500
    )
    RETURNING id
  `);

    console.log(`Cleanup pending verifications: deleted ${rows.length}`);

    return rows.length;
  }
};
