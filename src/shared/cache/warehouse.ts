import { redis } from "@/libs/redis";
import { REDIS_KEYS } from "./redis-keys";
import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { REDIS_TTL } from "./redis.ttl";

export async function getWarehouseOriginDistrictId(): Promise<number> {
  const cacheKey = REDIS_KEYS.WAREHOUSE_ORIGIN_DISTRICT;

  const cached = await redis.get(cacheKey);

  if (cached) {
    const parsed = Number(cached);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    await redis.del(cacheKey);
  }

  const { rows } = await db.raw<{
    rows: { shipping_district_id: number }[];
  }>(`
    SELECT shipping_district_id
    FROM warehouses
    LIMIT 1
  `);

  const row = rows[0];

  if (!row || !row.shipping_district_id) {
    throw AppError.badRequest("Shipping is not configured. Please contact admin.");
  }

  const districtId = row.shipping_district_id;

  await redis.set(cacheKey, String(districtId), {
    EX: REDIS_TTL.WAREHOUSE_ORIGIN
  });

  return districtId;
}
