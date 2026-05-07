import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";
import { deleteFile } from "@/libs/s3-client";
import { JOB_NAMES } from "@/workers/job-names";

export const cleanupOrphanProductImagesJob = {
  name: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,

  async handler() {
    const start = Date.now();

    try {
      const { rows } = await db.raw<{
        rows: { id: number; image_key: string }[];
      }>(`
        DELETE FROM product_images pi
        USING images_metadata im
        WHERE pi.id IN (
          SELECT pi2.id
          FROM product_images pi2
          WHERE pi2.is_orphan = true
            AND pi2.created_at < NOW() - INTERVAL '6 hours'

            -- PROTECT: order_items
            AND NOT EXISTS (
              SELECT 1
              FROM order_items oi
              WHERE oi.image_id = pi2.image_id
            )

          ORDER BY pi2.created_at ASC, id ASC
          LIMIT 50
        )
        AND pi.image_id = im.id
        RETURNING pi.id, im.image_key
      `);

      let successCount = 0;

      for (const row of rows) {
        try {
          await deleteFile(row.image_key);
          successCount++;

          logger.info("Deleted orphan product image", {
            jobName: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,
            imageKey: row.image_key
          });
        } catch (error) {
          logger.error("Failed deleting product image", {
            jobName: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,
            imageKey: row.image_key,
            error: error instanceof Error ? error.message : error
          });
        }
      }

      const duration = Date.now() - start;

      if (rows.length > 0) {
        logger.info("Cleanup orphan product images", {
          jobName: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,
          deleted: rows.length,
          fileDeleted: successCount,
          duration
        });
      }

      return rows.length;
    } catch (error) {
      logger.error("Cleanup orphan product images failed", {
        jobName: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }
};
