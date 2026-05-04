import { redis } from "@/libs/redis";

const isTest = process.env.NODE_ENV === "test";

export const cache = {
  async del(...keys: string[]) {
    if (isTest) return;
    return redis.del(keys);
  },

  async get(key: string) {
    if (isTest) return null;
    return redis.get(key);
  },

  async set(key: string, value: string, ttl?: number) {
    if (isTest) return;

    if (ttl) {
      return redis.set(key, value, { EX: ttl });
    }

    return redis.set(key, value);
  }
};
