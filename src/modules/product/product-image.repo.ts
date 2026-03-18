import { db } from "@/infra/db/knex";

export class ProductImageRepo {
  getProductImagesWithSignatures = async (productIds: number[]) => {
    const { rows } = await db.raw<{
      rows: {
        product_id: number;
        variant_image_id: number;
        image_id: number;
        image_key: string;
        dimension_key: string;
        value_key: string;
      }[];
    }>(
      `
    SELECT
      pvi.product_id,
      pvi.id AS variant_image_id,
      im.id AS image_id,
      im.image_key,
      sig.dimension_key,
      sig.value_key
    FROM product_variant_images pvi
    JOIN images_metadata im ON im.id = pvi.image_id
    JOIN product_variant_image_signatures sig ON sig.variant_image_id = pvi.id
    WHERE pvi.product_id = ANY(:productIds)
    AND pvi.is_orphan = false
    `,
      { productIds }
    );

    return rows;
  };

  getFallbackImages = async (productIds: number[]) => {
    const { rows } = await db.raw<{
      rows: {
        product_id: number;
        image_id: number;
        image_key: string;
      }[];
    }>(
      `
    SELECT DISTINCT ON (pi.product_id)
      pi.product_id,
      im.id AS image_id,
      im.image_key
    FROM product_images pi
    JOIN images_metadata im ON im.id = pi.image_id
    WHERE pi.product_id = ANY(:productIds)
    AND pi.is_orphan = false
    ORDER BY pi.product_id, pi.sort_order ASC, pi.id ASC
    `,
      { productIds }
    );

    return rows;
  };
}
