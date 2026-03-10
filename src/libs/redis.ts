import { env } from "@/config/env";
import { createClient } from "redis";

export const redis = createClient({
  url: env.REDIS_URL
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
