import { db } from "@/infra/db/knex";
import { redis } from "@/libs/redis";
import { REDIS_KEYS } from "@/shared/cache/redis-keys";

export async function getVariantDimensions(): Promise<string[]> {
  const key = REDIS_KEYS.VARIANT_DIMENSIONS;
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const { rows } = await db.raw<{ rows: { normalized_name: string }[] }>(`
    SELECT DISTINCT normalized_name
    FROM product_variant_dimensions
  `);

  const dimensions = rows.map((r) => r.normalized_name);

  await redis.set(key, JSON.stringify(dimensions), { EX: 3600 });

  return dimensions;
}

export async function getVariantValues(): Promise<Record<string, string[]>> {
  const key = REDIS_KEYS.VARIANT_VALUES;
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
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

  await redis.set(key, JSON.stringify(map), { EX: 3600 });

  return map;
}
