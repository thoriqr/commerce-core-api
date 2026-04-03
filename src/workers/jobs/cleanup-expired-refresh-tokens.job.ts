import { db } from "@/infra/db/knex";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupExpiredRefreshTokensJob = {
  name: JOB_NAMES.CLEANUP_EXPIRED_REFRESH_TOKENS,

  async handler() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      DELETE FROM refresh_tokens
      WHERE id IN (
        SELECT id
        FROM refresh_tokens
        WHERE
          -- DEV: delete immediately to keep table clean
          -- TODO(PROD): use interval (e.g. NOW() - INTERVAL '1 day')
          expires_at < NOW()

          OR (
            revoked_at IS NOT NULL
            AND revoked_at < NOW() - INTERVAL '7 days'
          )

        LIMIT 500
      )
      RETURNING id
    `);

    if (rows.length > 0) {
      console.log(`[cleanup] deleted ${rows.length} Refresh tokens`);
    }

    return rows.length;
  }
};
