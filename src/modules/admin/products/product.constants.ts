export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMG_FORMAT = ["jpeg", "png", "webp"] as const;
export const UPLOAD_FILE = {
  PRODUCT_FIELD: "productImages",
  VARIANT_FIELD: "variantImages",
  MAX_PRODUCT_IMG: 5,
  MAX_VARIANT_IMG: 10
};

export const VARIANT_LIMITS = {
  MAX_DIMENSIONS: 2,

  // per dimension
  MAX_OPTIONS_PER_DIMENSION: 10,

  // global safeguard
  MAX_TOTAL_VARIANTS: 100
} as const;

export const PRODUCT_IMG_LIMIT = 5;
