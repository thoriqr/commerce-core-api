import { redis } from "@/libs/redis";
import { REDIS_KEYS } from "./redis-keys";
import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { REDIS_TTL } from "./redis.ttl";

export async function getWarehouseOriginCityId(): Promise<number> {
  const cacheKey = REDIS_KEYS.WAREHOUSE_ORIGIN;

  const cached = await redis.get(cacheKey);

  if (cached) {
    const parsed = Number(cached);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    await redis.del(cacheKey); // cleanup invalid cache
  }

  const { rows } = await db.raw<{
    rows: { shipping_city_id: number }[];
  }>(`
    SELECT shipping_city_id
    FROM warehouses
    LIMIT 1
  `);

  const row = rows[0];

  if (!row) {
    throw AppError.badRequest("Shipping is not configured. Please contact admin.");
  }

  const cityId = row.shipping_city_id;

  await redis.set(cacheKey, String(cityId), {
    EX: REDIS_TTL.WAREHOUSE_ORIGIN
  });

  return cityId;
}
