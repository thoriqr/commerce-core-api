import { cleanupOrphanProductImagesJob } from "./jobs/cleanup-orphan-product-images.job";
import { cleanupOrphanVariantImagesJob } from "./jobs/cleanup-orphan-variant-images.job";
import { cleanupExpiredRefreshTokensJob } from "./jobs/cleanup-expired-refresh-tokens.job";
import { cleanupPendingVerificationsJob } from "./jobs/cleanup-pending-verifications.job";

type JobHandler = (data?: unknown) => Promise<unknown>;

const jobs = [cleanupOrphanProductImagesJob, cleanupOrphanVariantImagesJob, cleanupExpiredRefreshTokensJob, cleanupPendingVerificationsJob];

export const jobRegistry = new Map<string, JobHandler>(jobs.map((job) => [job.name, job.handler]));
