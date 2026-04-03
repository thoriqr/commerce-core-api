import { db } from "@/infra/db/knex";
import { deleteFile } from "@/libs/s3-client";
import { JOB_NAMES } from "@/shared/queues/job-names";

export const cleanupOrphanProductImagesJob = {
  name: JOB_NAMES.CLEANUP_ORPHAN_PRODUCT_IMAGES,

  async handler() {
    const { rows } = await db.raw(`
      DELETE FROM product_images pi
      USING images_metadata im
      WHERE pi.id IN (
        SELECT pi2.id
        FROM product_images pi2
        WHERE pi2.is_orphan = true
          AND pi2.created_at < NOW() - INTERVAL '30 minutes'

          -- PROTECT: order_items
          AND NOT EXISTS (
            SELECT 1
            FROM order_items oi
            WHERE oi.image_id = pi2.image_id
          )

        LIMIT 50
      )
      AND pi.image_id = im.id
      RETURNING pi.id, im.image_key
`);

    for (const row of rows) {
      try {
        await deleteFile(row.image_key);
        console.log("Deleted orphan product image:", row.image_key);
      } catch (err) {
        console.error("Failed deleting product image:", row.image_key, err);
      }
    }

    if (rows.length > 0) {
      console.log(`[cleanup] deleted ${rows.length} Product images`);
    }

    return rows.length;
  }
};
