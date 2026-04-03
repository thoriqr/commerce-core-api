export const JOB_NAMES = {
  CLEANUP_ORPHAN_PRODUCT_IMAGES: "cleanup-orphan-product-images",
  CLEANUP_ORPHAN_VARIANT_IMAGES: "cleanup-orphan-variant-images",
  CLEANUP_EXPIRED_REFRESH_TOKENS: "cleanup-expired-refresh-tokens",
  CLEANUP_PENDING_VERIFICATIONS: "cleanup-pending-verifications",
  CLEANUP_ABANDONED_GUEST_CARTS: "cleanup-abandoned-guest-carts",
  CLEANUP_CHECKOUT_SESSIONS: "cleanup-checkout-sessions",
  EXPIRE_ORDERS: "expire-orders",
  AUTO_COMPLETE_DELIVERED_ORDERS: "auto-complete-delivered-orders"
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
