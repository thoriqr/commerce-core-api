import { cleanupOrphanProductImagesJob } from "./jobs/cleanup-orphan-product-images.job";
import { cleanupOrphanVariantImagesJob } from "./jobs/cleanup-orphan-variant-images.job";
import { cleanupExpiredRefreshTokensJob } from "./jobs/cleanup-expired-refresh-tokens.job";
import { cleanupPendingVerificationsJob } from "./jobs/cleanup-pending-verifications.job";
import { cleanupAbandonedGuestCartsJob } from "./jobs/cleanup-abandoned-guest-carts.job";
import { cleanupCheckoutSessionsJob } from "./jobs/cleanup-checkout-sessions.job";
import { expireOrdersJob } from "./jobs/expire-orders.job";
import { autoCompleteDeliveredOrdersJob } from "./jobs/auto-complete-delivered-orders.job";

type JobHandler = (data?: unknown) => Promise<unknown>;

const jobs = [
  cleanupOrphanProductImagesJob,
  cleanupOrphanVariantImagesJob,
  cleanupExpiredRefreshTokensJob,
  cleanupPendingVerificationsJob,
  cleanupAbandonedGuestCartsJob,
  cleanupCheckoutSessionsJob,
  expireOrdersJob,
  autoCompleteDeliveredOrdersJob
];

export const jobRegistry = new Map<string, JobHandler>(jobs.map((job) => [job.name, job.handler]));
