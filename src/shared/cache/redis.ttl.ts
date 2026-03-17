export const REDIS_TTL = {
  VARIANT_IMAGES: 60 * 30, // 30min
  VARIANT_DIMENSIONS: 60 * 60 * 24, // 1day
  VARIANT_VALUES: 60 * 60 * 24
} as const;
