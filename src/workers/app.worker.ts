import { Worker } from "bullmq";
import { redisConnection } from "@/libs/redis-bullmq";
import { jobRegistry } from "./jobs";

console.log("Worker starting...");

export const appWorker = new Worker(
  "app-queue",
  async (job) => {
    const handler = jobRegistry.get(job.name);

    if (!handler) {
      throw new Error(`Unknown job: ${job.name}`);
    }

    const start = Date.now();

    console.log(`Processing job: ${job.name}`);

    const result = await handler(job.data);

    console.log(`Job ${job.name} finished in ${Date.now() - start}ms`);

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
);

appWorker.on("ready", () => {
  console.log("🟢 Worker connected to Redis");
});

appWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.name} completed`);
});

appWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.name} failed`, err);
});

appWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

process.on("SIGINT", async () => {
  console.log("Worker shutting down...");
  await appWorker.close();
  process.exit(0);
});
