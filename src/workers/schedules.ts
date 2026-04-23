import { JOB_NAMES } from "@/shared/queues/job-names";

export const schedules = [
  { name: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES, pattern: "0 */12 * * *" }, // every 12 hours
  { name: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES, pattern: "0 */12 * * *" }, // every 12 hours
  { name: JOB_NAMES.CLEANUP_EXPIRED_REFRESH_TOKENS, pattern: "0 * * * *" }, // every 1 hour
  { name: JOB_NAMES.CLEANUP_PENDING_VERIFICATIONS, pattern: "*/30 * * * *" }, // every 30 minutes
  { name: JOB_NAMES.CLEANUP_ABANDONED_GUEST_CARTS, pattern: "0 */6 * * *" }, // every 6 hours
  { name: JOB_NAMES.CLEANUP_CHECKOUT_SESSIONS, pattern: "0 * * * *" }, // every 1 hour
  { name: JOB_NAMES.EXPIRE_ORDERS, pattern: "*/5 * * * *" }, // every 5 minutes
  { name: JOB_NAMES.AUTO_COMPLETE_DELIVERED_ORDERS, pattern: "0 */6 * * *" } // every 6 hours
];
