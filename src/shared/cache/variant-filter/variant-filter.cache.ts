import { db } from "@/infra/db/knex";
import { redis } from "@/libs/redis";
import { REDIS_KEYS } from "@/shared/cache/redis-keys";
import { REDIS_TTL } from "@/shared/cache/redis.ttl";

export async function getVariantDimensions(): Promise<string[]> {
  const key = REDIS_KEYS.VARIANT_DIMENSIONS;
  const cached = await redis.get(key);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      await redis.del(key);
    }
  }

  const { rows } = await db.raw<{ rows: { normalized_name: string }[] }>(`
    SELECT DISTINCT normalized_name
    FROM product_variant_dimensions
  `);

  const dimensions = rows.map((r) => r.normalized_name);

  await redis.set(key, JSON.stringify(dimensions), { EX: REDIS_TTL.VARIANT_DIMENSIONS });

  return dimensions;
}

export async function getVariantValues(): Promise<Record<string, string[]>> {
  const key = REDIS_KEYS.VARIANT_VALUES;
  const cached = await redis.get(key);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      await redis.del(key);
    }
  }

  const { rows } = await db.raw<{
    rows: { normalized_name: string; normalized_value: string }[];
  }>(`
    SELECT DISTINCT
      d.normalized_name,
      v.normalized_value
    FROM product_variant_dimension_values v
    JOIN product_variant_dimensions d
      ON d.id = v.dimension_id
  `);

  const map: Record<string, string[]> = {};

  for (const { normalized_name, normalized_value } of rows) {
    map[normalized_name] ??= [];
    map[normalized_name]!.push(normalized_value);
  }

  await redis.set(key, JSON.stringify(map), { EX: REDIS_TTL.VARIANT_VALUES });

  return map;
}
