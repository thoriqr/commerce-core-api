import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";

export async function runCleanup(jobName: string, query: string): Promise<number> {
  const start = Date.now();

  try {
    const { rows } = await db.raw<{ rows: { id: number }[] }>(query);

    const count = rows.length;
    const duration = Date.now() - start;

    if (count > 0) {
      logger.info(jobName, {
        deleted: count,
        duration
      });
    }

    return count;
  } catch (error) {
    logger.error(`${jobName} failed`, {
      error: error instanceof Error ? error.message : error
    });

    throw error;
  }
}
