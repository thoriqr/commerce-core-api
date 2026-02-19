import { db } from "@/infra/db/knex";
import { CollectionDetailRow, CollectionPreviewRow } from "./collection.types";
import { buildProductCardJoins } from "../products/sql/product-card.sql";
import { AppError } from "@/errors/app-error";

export class CollectionRepo {
  async getCollectionsWithProductPreview(productLimit: number) {
    const { rows } = await db.raw<{
      rows: CollectionPreviewRow[];
    }>(
      `
    SELECT
      col.id AS collection_id,
      col.name AS collection_name,
      col.slug AS collection_slug,

      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      im.image_key,
      v.price AS display_price,
      p.created_at

    FROM collections col

    JOIN LATERAL (
      SELECT p.*
      FROM product_collections pc
      JOIN products p ON p.id = pc.product_id
      WHERE pc.collection_id = col.id
        AND p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
      LIMIT :productLimitPlusOne
    ) p ON true

    ${buildProductCardJoins("p")}

    WHERE col.status = 'ACTIVE'

    ORDER BY col.sort_order ASC, col.id ASC
  `,
      {
        productLimitPlusOne: productLimit + 1
      }
    );

    const meta = await this.getCollectionsPreviewETagMeta();
    const etagSeed = this.buildCollectionsPreviewETagSeed(meta);

    return { rows, etagSeed };
  }

  private async getCollectionsPreviewETagMeta() {
    const { rows } = await db.raw<{
      rows: {
        max_collection_updated_at: Date | null;
        max_product_updated_at: Date | null;
        max_variant_updated_at: Date | null;
      }[];
    }>(`
    SELECT
      MAX(col.updated_at) AS max_collection_updated_at,
      MAX(p.updated_at) AS max_product_updated_at,
      MAX(v.updated_at) AS max_variant_updated_at
    FROM collections col
    LEFT JOIN product_collections pc ON pc.collection_id = col.id
    LEFT JOIN products p ON p.id = pc.product_id
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE col.status = 'ACTIVE'
  `);

    const row = rows[0];

    return {
      max_collection_updated_at: row?.max_collection_updated_at ?? null,
      max_product_updated_at: row?.max_product_updated_at ?? null,
      max_variant_updated_at: row?.max_variant_updated_at ?? null
    };
  }

  private buildCollectionsPreviewETagSeed(meta: {
    max_collection_updated_at: Date | null;
    max_product_updated_at: Date | null;
    max_variant_updated_at: Date | null;
  }) {
    return `
  homepage-collections:
  ${meta.max_collection_updated_at?.toISOString() ?? "none"}:
  ${meta.max_product_updated_at?.toISOString() ?? "none"}:
  ${meta.max_variant_updated_at?.toISOString() ?? "none"}
  `;
  }

  async getBySlug(slug: string) {
    const { rows } = await db.raw<{ rows: CollectionDetailRow[] }>(
      `
      SELECT
        id,
        name,
        slug,
        description,
        updated_at
      FROM collections
      WHERE slug = :slug
        AND status = 'ACTIVE'
      LIMIT 1
      `,
      { slug }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Collection not found");
    }

    const etagSeed = `
      collection-detail:
      ${slug}:
      ${row.updated_at?.toISOString() ?? "none"}
    `;

    return { row, etagSeed };
  }
}
