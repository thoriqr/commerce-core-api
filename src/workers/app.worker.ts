import { Worker } from "bullmq";
import { redisConnection } from "@/libs/redis-bullmq";
import { jobRegistry } from "./job-registry";
import { registerJobs } from "./scheduler";
import { logger } from "@/libs/logger";
import { env } from "@/config/env";
import { startCronJobs } from "./cron";

async function startWorker() {
  logger.info("Worker starting...", {
    driver: env.SCHEDULER_DRIVER
  });

  // CRON MODE
  if (env.SCHEDULER_DRIVER === "cron") {
    startCronJobs();

    logger.info("Running in CRON mode (no BullMQ)");

    return;
  }

  // BULL MODE (existing code)
  logger.info("Running in BULLMQ mode");

  await registerJobs();

  const worker = new Worker(
    "app-queue",
    async (job) => {
      const handler = jobRegistry.get(job.name);

      if (!handler) {
        logger.error("Unknown job received", {
          jobName: job.name,
          jobId: job.id
        });
        throw new Error(`Unknown job: ${job.name}`);
      }

      logger.info("Processing job", {
        jobName: job.name,
        jobId: job.id
      });

      const start = Date.now();

      try {
        const result = await handler(job.data);

        return {
          result,
          duration: Date.now() - start
        };
      } catch (error) {
        logger.error("Job execution error", {
          jobName: job.name,
          jobId: job.id,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,

      // optional improvement
      blockingConnection: true,
      drainDelay: 30
    }
  );

  worker.on("ready", () => {
    logger.info("Worker connected to Redis");
  });

  worker.on("failed", (job, err) => {
    logger.error("Job failed", {
      jobName: job?.name,
      jobId: job?.id,
      error: err instanceof Error ? err.message : err
    });
  });

  const shutdown = async (signal: string) => {
    logger.info("Worker shutting down...", { signal });

    try {
      await worker.close();
      logger.info("Worker closed gracefully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during worker shutdown", {
        error: error instanceof Error ? error.message : error
      });
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startWorker();
