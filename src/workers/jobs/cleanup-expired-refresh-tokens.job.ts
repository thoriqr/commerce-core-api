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
          expires_at < NOW() - INTERVAL '7 days'
          OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days')
        LIMIT 500
      )
      RETURNING id
    `);

    console.log(`Refresh token cleanup removed ${rows.length} tokens`);

    return rows.length;
  }
};
