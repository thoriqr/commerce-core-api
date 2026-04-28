export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMG_FORMAT = ["jpeg", "png", "webp"] as const;
export const UPLOAD_FILE = {
  PRODUCT_FIELD: "productImages",
  VARIANT_FIELD: "variantImages",
  MAX_PRODUCT_IMG: 5,
  MAX_VARIANT_IMG: 10,
  PRODUCT_FILE_SIZE: 2 * 1024 * 1024
} as const;

export const VARIANT_LIMITS = {
  // schema
  MAX_DIMENSIONS: 2,
  MAX_OPTIONS_PER_DIMENSION: 10,
  MAX_TOTAL_VARIANTS: 100,

  DIMENSION_NAME_MIN: 2,
  DIMENSION_NAME_MAX: 30,
  OPTION_VALUE_MIN: 1,
  OPTION_VALUE_MAX: 50
} as const;

export const PRODUCT_IMAGE_MAX_SIZE = {
  width: 1200,
  height: 1200
} as const;

export const PRODUCT_IMAGE_MIN_SIZE = {
  width: 300,
  height: 300
} as const;
