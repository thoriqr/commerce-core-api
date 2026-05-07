import { logger } from "@/libs/logger";
import { startCronJobs } from "./cron";

async function startWorker() {
  logger.info("Worker starting...");

  startCronJobs();

  logger.info("Cron jobs started");
}

startWorker();
