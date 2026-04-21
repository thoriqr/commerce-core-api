import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";
import { deleteFile } from "@/libs/s3-client";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupOrphanVariantImagesJob = {
  name: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,

  async handler() {
    const start = Date.now();

    try {
      const { rows } = await db.raw<{
        rows: { id: number; image_key: string }[];
      }>(`
        DELETE FROM product_variant_images pvi
        USING images_metadata im
        WHERE pvi.id IN (
          SELECT pvi2.id
          FROM product_variant_images pvi2
          WHERE pvi2.is_orphan = true
            AND pvi2.created_at < NOW() - INTERVAL '6 hours'

            -- PROTECT order_items image_id
            AND NOT EXISTS (
              SELECT 1
              FROM order_items oi
              WHERE oi.image_id = pvi2.image_id
            )

          ORDER BY pvi2.created_at ASC, id ASC
          LIMIT 50
        )
        AND pvi.image_id = im.id
        RETURNING pvi.id, im.image_key
      `);

      let successCount = 0;

      for (const row of rows) {
        try {
          await deleteFile(row.image_key);
          successCount++;

          logger.info("Deleted orphan variant image", {
            jobName: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,
            imageKey: row.image_key
          });
        } catch (error) {
          logger.error("Failed deleting variant image", {
            jobName: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,
            imageKey: row.image_key,
            error: error instanceof Error ? error.message : error
          });
        }
      }

      const duration = Date.now() - start;

      if (rows.length > 0) {
        logger.info("Cleanup orphan variant images", {
          jobName: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,
          deleted: rows.length,
          fileDeleted: successCount,
          duration
        });
      }

      return rows.length;
    } catch (error) {
      logger.error("Cleanup orphan variant images failed", {
        jobName: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }
};
