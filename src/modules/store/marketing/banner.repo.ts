import { db } from "@/infra/db/knex";
import { BannerQueryParams } from "./banner.schema";
import { BannerRow } from "./banner.types";

export class BannerRepo {
  async getActiveByPlacement(qParams: BannerQueryParams) {
    const { rows } = await db.raw<{
      rows: BannerRow[];
    }>(
      `
      SELECT
        mb.id,
        mb.title,
        mb.placement,
        im.image_key,
        mb.target_type,
        mb.target_entity_id,
        mb.sort_order,
        MAX(mb.updated_at) OVER() AS max_updated_at,
        COUNT(*) OVER() AS total
      FROM marketing_banners mb
      JOIN images_metadata im ON im.id = mb.image_id
      WHERE mb.status = 'ACTIVE'
        AND mb.placement = :placement
      ORDER BY mb.sort_order ASC, mb.id ASC
      `,
      { placement: qParams.placement }
    );

    const first = rows[0];

    const etagSeed = first ? `${qParams.placement}:${first.max_updated_at}:${first.total}` : `${qParams.placement}:empty`;

    return {
      rows,
      etagSeed
    };
  }

  async buildCategoryUrl(categoryId: number): Promise<string> {
    const { rows } = await db.raw<{ rows: { slug_path: string }[] }>(
      `
    SELECT string_agg(c.slug, '/' ORDER BY array_position(string_to_array(parent.id_path, '/'), c.id::text)) AS slug_path
    FROM categories parent
    JOIN categories c 
      ON c.id::text = ANY(string_to_array(parent.id_path, '/'))
    WHERE parent.id = :id
    GROUP BY parent.id_path
    `,
      { id: categoryId }
    );

    const row = rows[0];
    if (!row) return "#";

    return `/category/${row.slug_path}`;
  }

  async buildCollectionUrl(collectionId: number): Promise<string> {
    const { rows } = await db.raw<{ rows: { slug: string }[] }>(`SELECT slug FROM collections WHERE id = :id LIMIT 1`, { id: collectionId });

    const row = rows[0];
    if (!row) return "#";

    return `/collection/${row.slug}`;
  }
}
