import { TransactionManager } from "@/infra/db/transaction-manager";
import { WorkerRepo } from "./worker.repo";
import { deleteFile } from "@/libs/s3-client";

export class WorkerService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly repo: WorkerRepo
  ) {}

  expireOrders = async () => {
    const expireOrders = await this.tm.transaction(async (trx) => {
      return this.repo.expireOrders(trx);
    });

    return {
      expireOrders
    };
  };

  maintenanceSession = async () => {
    const cleanupExpiredUserSessions = await this.repo.cleanupExpiredUserSessions();

    const cleanupPendingVerifications = await this.repo.cleanupPendingVerifications();

    const cleanupCheckoutSessions = await this.repo.cleanupCheckoutSessions();

    return {
      cleanupExpiredUserSessions,
      cleanupPendingVerifications,
      cleanupCheckoutSessions
    };
  };

  maintenanceAssets = async () => {
    const productImages = await this.repo.cleanupOrphanProductImages();

    let deletedProductFiles = 0;

    for (const image of productImages) {
      try {
        await deleteFile(image.image_key);
        deletedProductFiles++;
      } catch {
        // Ignore object storage failures and continue processing remaining images.
      }
    }

    const variantImages = await this.repo.cleanupOrphanVariantImages();

    let deletedVariantFiles = 0;

    for (const image of variantImages) {
      try {
        await deleteFile(image.image_key);
        deletedVariantFiles++;
      } catch {
        // Ignore object storage failures and continue processing remaining images.
      }
    }

    return {
      cleanupOrphanProductImages: {
        deleted: productImages.length,
        fileDeleted: deletedProductFiles
      },
      cleanupOrphanVariantImages: {
        deleted: variantImages.length,
        fileDeleted: deletedVariantFiles
      }
    };
  };
}
