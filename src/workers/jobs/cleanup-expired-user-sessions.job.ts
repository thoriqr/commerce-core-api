import { JOB_NAMES } from "@/workers/job-names";
import { runCleanup } from "./cleanup.helper";

export const cleanupExpiredUserSessionsJob = {
  name: JOB_NAMES.CLEANUP_EXPIRED_USER_SESSIONS,

  async handler() {
    return runCleanup(
      JOB_NAMES.CLEANUP_EXPIRED_USER_SESSIONS,
      `
      DELETE FROM user_sessions
        WHERE id IN (
        SELECT id
        FROM user_sessions
        WHERE
          (
            revoked_at IS NOT NULL
            AND revoked_at < NOW() - INTERVAL '7 days'
          )
          OR
          (
            last_used_at < NOW() - INTERVAL '90 days'
          )
      ORDER BY last_used_at ASC
      LIMIT 500
    )
      RETURNING id;
      `
    );
  }
};
