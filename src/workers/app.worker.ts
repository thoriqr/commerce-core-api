import { Worker } from "bullmq";
import { redisConnection } from "@/libs/redis-bullmq";
import { jobRegistry } from "./job-registry";
import { registerJobs } from "./scheduler";

async function startWorker() {
  console.log("Starting worker...");

  await registerJobs();

  const worker = new Worker(
    "app-queue",
    async (job) => {
      const handler = jobRegistry.get(job.name);

      if (!handler) {
        throw new Error(`Unknown job: ${job.name}`);
      }

      console.log(`Processing job: ${job.name}`);

      return handler(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 1
    }
  );

  worker.on("ready", () => {
    console.log("🟢 Worker connected to Redis");
  });

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.name} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.name} failed`, err);
  });

  process.on("SIGINT", async () => {
    console.log("Worker shutting down...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Worker shutting down...");
    await worker.close();
    process.exit(0);
  });
}

startWorker();
