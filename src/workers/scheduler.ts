import { logger } from "@/libs/logger";
import { appQueue } from "@/queues/app.queue";
import { schedules } from "./schedules";

export async function registerJobs() {
  const defaultOpts = {
    removeOnComplete: true,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 5000
    }
  };

  for (const job of schedules) {
    await appQueue.upsertJobScheduler(
      job.name,
      { pattern: job.pattern },
      {
        name: job.name,
        data: {},
        opts: defaultOpts
      }
    );

    logger.info("Scheduled job", {
      jobName: job.name,
      pattern: job.pattern
    });
  }
}
