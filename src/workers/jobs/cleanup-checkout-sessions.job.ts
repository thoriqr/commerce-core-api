import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupCheckoutSessionsJob = {
  name: JOB_NAMES.CLEANUP_CHECKOUT_SESSIONS,

  async handler() {
    const start = Date.now();

    try {
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
          ORDER BY expires_at ASC
          LIMIT 500
        )
        RETURNING id;
      `);

      const deletedCount = rows.length;
      const duration = Date.now() - start;

      if (deletedCount > 0) {
        logger.info("Cleanup checkout sessions", {
          jobName: JOB_NAMES.CLEANUP_CHECKOUT_SESSIONS,
          deleted: deletedCount,
          duration
        });
      }

      return deletedCount;
    } catch (error) {
      logger.error("Cleanup checkout sessions failed", {
        jobName: JOB_NAMES.CLEANUP_CHECKOUT_SESSIONS,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }
};
