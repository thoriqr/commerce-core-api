import { appQueue } from "@/queues/app.queue";
import { JOB_NAMES } from "@/shared/queues/job-names";

export async function registerJobs() {
  const jobs = [
    {
      name: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,
      pattern: "0 * * * *" // every 1 hour
    },
    {
      name: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,
      pattern: "0 * * * *" // every 1 hour
    },
    {
      name: JOB_NAMES.CLEANUP_EXPIRED_REFRESH_TOKENS,
      pattern: "0 * * * *" // every 1 hour
    },
    {
      name: JOB_NAMES.CLEANUP_PENDING_VERIFICATIONS,
      pattern: "*/30 * * * *" // every 30 minutes
    },
    {
      name: JOB_NAMES.CLEANUP_ABANDONED_GUEST_CARTS,
      pattern: "0 */6 * * *" // every 6 hours
    },
    {
      name: JOB_NAMES.CLEANUP_CHECKOUT_SESSIONS,
      pattern: "0 * * * *" // every 1 hour
    },
    {
      name: JOB_NAMES.EXPIRE_ORDERS,
      pattern: "*/10 * * * *" // every 10 minutes
    }
  ];

  const defaultOpts = {
    removeOnComplete: true,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 5000
    }
  };

  for (const job of jobs) {
    await appQueue.upsertJobScheduler(
      job.name,
      { pattern: job.pattern },
      {
        name: job.name,
        data: {},
        opts: defaultOpts
      }
    );

    console.log(`Scheduled ${job.name}`);
  }
}
