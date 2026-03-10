import { Queue } from "bullmq";
import { redisConnection } from "@/libs/redis-bullmq";

export const appQueue = new Queue("app-queue", {
  connection: redisConnection
});
