import { cleanupOrphanProductImagesJob } from "./jobs/cleanup-orphan-product-images.job";
import { cleanupOrphanVariantImagesJob } from "./jobs/cleanup-orphan-variant-images.job";
import { cleanupExpiredUserSessionsJob } from "./jobs/cleanup-expired-user-sessions.job";
import { cleanupPendingVerificationsJob } from "./jobs/cleanup-pending-verifications.job";
import { cleanupCheckoutSessionsJob } from "./jobs/cleanup-checkout-sessions.job";
import { expireOrdersJob } from "./jobs/expire-orders.job";
import { autoCompleteDeliveredOrdersJob } from "./jobs/auto-complete-delivered-orders.job";

type JobHandler = (data?: unknown) => Promise<unknown>;

const jobs = [
  cleanupOrphanProductImagesJob,
  cleanupOrphanVariantImagesJob,
  cleanupExpiredUserSessionsJob,
  cleanupPendingVerificationsJob,
  cleanupCheckoutSessionsJob,
  expireOrdersJob,
  autoCompleteDeliveredOrdersJob
];

export const registry = new Map<string, JobHandler>(jobs.map((job) => [job.name, job.handler]));
