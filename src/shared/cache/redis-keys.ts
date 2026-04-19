export const REDIS_KEYS = {
  VARIANT_DIMENSIONS: "commerce:variant:dimensions",
  VARIANT_VALUES: "commerce:variant:values",
  VARIANT_IMAGES: (productId: number) => `commerce:variant-images:${productId}`,
  WAREHOUSE_ORIGIN_DISTRICT: "commerce:warehouse:origin"
} as const;
