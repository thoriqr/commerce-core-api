import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";
import { runCleanup } from "./cleanup.helper";

export const cleanupPendingVerificationsJob = {
  name: JOB_NAMES.CLEANUP_PENDING_VERIFICATIONS,

  async handler() {
    return runCleanup(
      JOB_NAMES.CLEANUP_PENDING_VERIFICATIONS,
      `
      DELETE FROM pending_verifications
      WHERE id IN (
        SELECT id
        FROM pending_verifications
        WHERE used_at IS NULL
          AND expires_at < NOW()
        LIMIT 500
      )
      RETURNING id
      `
    );
  }
};
