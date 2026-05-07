import cron from "node-cron";
import { logger } from "@/libs/logger";
import { registry } from "./registry";
import { schedules } from "./schedules";

const runningJobs = new Set<string>();

function runSafeJob(name: string) {
  const handler = registry.get(name);

  if (!handler) {
    logger.error("Job not found", { jobName: name });
    return;
  }

  if (runningJobs.has(name)) {
    logger.warn("Skip job (still running)", { jobName: name });
    return;
  }

  runningJobs.add(name);

  (async () => {
    try {
      await handler();
    } catch (error) {
      logger.error("Cron job failed", {
        jobName: name,
        error: error instanceof Error ? error.message : error
      });
    } finally {
      runningJobs.delete(name);
    }
  })();
}

export function startCronJobs() {
  logger.info("Cron scheduler started");

  for (const job of schedules) {
    cron.schedule(job.pattern, () => {
      logger.info("Running cron", { jobName: job.name });

      try {
        runSafeJob(job.name);
      } catch (error) {
        logger.error("Cron job failed", {
          jobName: job.name,
          error: error instanceof Error ? error.message : error
        });
      }
    });
  }
}
