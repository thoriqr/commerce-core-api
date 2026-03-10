import { db } from "@/infra/db/knex";
import { deleteFile } from "@/libs/s3-client";

export const jobName = "cleanup-orphan-product-images";

export async function handler() {
  const { rows } = await db.raw<{
    rows: { id: number; image_key: string }[];
  }>(`
    DELETE FROM product_images pi
    USING images_metadata im
    WHERE pi.id IN (
      SELECT id
      FROM product_images
      WHERE is_orphan = true
        AND created_at < NOW() - INTERVAL '30 minutes'
      LIMIT 50
    )
    AND pi.image_id = im.id
    RETURNING pi.id, im.image_key
  `);

  for (const row of rows) {
    try {
      await deleteFile(row.image_key);
      console.log("Deleted orphan image:", row.image_key);
    } catch (err) {
      console.error("Failed deleting image:", row.image_key, err);
    }
  }

  console.log(`Cleanup finished. Deleted ${rows.length} images`);

  return rows.length;
}
