import { db } from "@/infra/db/knex";
import { deleteFile } from "@/libs/s3-client";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupOrphanVariantImagesJob = {
  name: JOB_NAMES.CLEANUP_ORPHAN_VARIANT_IMAGES,

  async handler() {
    const { rows } = await db.raw<{
      rows: { id: number; image_key: string }[];
    }>(`
      DELETE FROM product_variant_images pvi
      USING images_metadata im
      WHERE pvi.id IN (
        SELECT id
        FROM product_variant_images
        WHERE is_orphan = true
          AND created_at < NOW() - INTERVAL '30 minutes'
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
