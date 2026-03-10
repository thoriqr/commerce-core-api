import { appQueue } from "./app.queue";

export async function registerJobs() {
  await appQueue.upsertJobScheduler(
    "cleanup-orphan-product-images",
    {
      pattern: "*/10 * * * *" // 10m
    },
    {
      name: "cleanup-orphan-product-images",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        }
      }
    }
  );

  console.log("Scheduled cleanup-orphan-product-images");
}

registerJobs();
