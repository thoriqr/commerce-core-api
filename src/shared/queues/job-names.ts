export const JOB_NAMES = {
  CLEANUP_ORPHAN_PRODUCT_IMAGES: "cleanup-orphan-product-images",
  CLEANUP_ORPHAN_VARIANT_IMAGES: "cleanup-orphan-variant-images",
  CLEANUP_EXPIRED_REFRESH_TOKENS: "cleanup-expired-refresh-tokens",
  CLEANUP_PENDING_VERIFICATIONS: "cleanup-pending-verifications"
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
