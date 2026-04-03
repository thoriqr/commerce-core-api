export function buildProductCardJoins(productAlias: string = "p") {
  return `
    JOIN LATERAL (
      SELECT v.id, v.price
      FROM product_variants v
      WHERE v.product_id = ${productAlias}.id
        AND v.status = 'ACTIVE'
      ORDER BY v.is_primary DESC, v.id ASC
      LIMIT 1
    ) v ON true

    JOIN LATERAL (
      SELECT pi.image_id
      FROM product_images pi
      WHERE pi.product_id = ${productAlias}.id
        AND pi.is_orphan = false
      ORDER BY pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ) img ON true

    JOIN images_metadata im ON im.id = img.image_id
  `;
}
