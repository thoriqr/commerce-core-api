import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";
import { runCleanup } from "./cleanup.helper";

export const cleanupExpiredRefreshTokensJob = {
  name: JOB_NAMES.CLEANUP_EXPIRED_REFRESH_TOKENS,

  async handler() {
    return runCleanup(
      JOB_NAMES.CLEANUP_EXPIRED_REFRESH_TOKENS,
      `
      DELETE FROM refresh_tokens
      WHERE id IN (
        SELECT id
        FROM refresh_tokens
        WHERE
          expires_at < NOW()
          OR (
            revoked_at IS NOT NULL
            AND revoked_at < NOW() - INTERVAL '7 days'
          )
        LIMIT 500
      )
      RETURNING id
      `
    );
  }
};
