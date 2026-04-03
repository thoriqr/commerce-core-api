import { Worker } from "bullmq";
import { redisConnection } from "@/libs/redis-bullmq";
import { jobRegistry } from "./job-registry";
import { registerJobs } from "./scheduler";
import { logger } from "@/libs/logger";

async function startWorker() {
  logger.info("Worker starting...");

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

        const duration = Date.now() - start;

        return {
          result,
          duration
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
      concurrency: 1
    }
  );

  // Connected
  worker.on("ready", () => {
    logger.info("Worker connected to Redis");
  });

  // Error
  worker.on("failed", (job, err) => {
    logger.error("Job failed", {
      jobName: job?.name,
      jobId: job?.id,
      error: err instanceof Error ? err.message : err
    });
  });

  // Graceful shutdown
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
