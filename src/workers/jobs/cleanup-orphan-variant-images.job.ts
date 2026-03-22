import { db } from "@/infra/db/knex";
import { deleteFile } from "@/libs/s3-client";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupOrphanVariantImagesJob = {
  name: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,

  async handler() {
    const { rows } = await db.raw(`
      DELETE FROM product_variant_images pvi
      USING images_metadata im
      WHERE pvi.id IN (
        SELECT pvi2.id
        FROM product_variant_images pvi2
        WHERE pvi2.is_orphan = true
          AND pvi2.created_at < NOW() - INTERVAL '30 minutes'

          -- PROTECT order_items image_id
          AND NOT EXISTS (
            SELECT 1
            FROM order_items oi
            WHERE oi.image_id = pvi2.image_id
          )

        LIMIT 50
      )
      AND pvi.image_id = im.id
      RETURNING pvi.id, im.image_key
    `);

    for (const row of rows) {
      try {
        await deleteFile(row.image_key);
        console.log("Deleted orphan variant image:", row.image_key);
      } catch (err) {
        console.error("Failed deleting variant image:", row.image_key, err);
      }
    }

    console.log(`Variant image cleanup finished. Deleted ${rows.length} images`);

    return rows.length;
  }
};
