import { Knex } from "knex";
import { BannerImagesQueryParamsSchema, BannerReorderSchema, BannerUpsertSchema } from "./banner.schema";
import { BannerDetailRow, BannerImageRow, BannerListRow, BannerResolvedRow, ImagePayload } from "./banner.types";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";
import { IMAGE_CONTEXT } from "@/constants/image-context";
import { db } from "@/infra/db/knex";
import { mapBannerDetail, mapBannerImages, mapBannerList } from "./banner.mapper";

export class BannerRepo {
  async getAll() {
    const { rows } = await db.raw<{ rows: BannerListRow[] }>(`
    SELECT 
      mb.id,
      mb.title,
      mb.placement,
      im.image_key,
      mb.target_type,
      mb.target_entity_id,
      mb.status,
      mb.sort_order
    FROM marketing_banners mb
    JOIN images_metadata im ON im.id = mb.image_id
    ORDER BY mb.sort_order ASC, mb.id ASC
  `);

    const resolved: BannerResolvedRow[] = [];

    for (const row of rows) {
      let url = "#";

      if (row.target_type === "category" && row.target_entity_id) {
        url = await this.buildCategoryUrl(row.target_entity_id);
      }

      if (row.target_type === "collection" && row.target_entity_id) {
        url = await this.buildCollectionUrl(row.target_entity_id);
      }

      resolved.push({
        id: row.id,
        title: row.title,
        placement: row.placement,
        image_key: row.image_key,
        target_type: row.target_type,
        url,
        status: row.status,
        sort_order: row.sort_order
      });
    }

    return mapBannerList(resolved);
  }

  async getById(bannerId: number) {
    const { rows } = await db.raw<{ rows: BannerDetailRow[] }>(
      `
      SELECT
        mb.id,
        mb.title,
        mb.placement,
        mb.image_id,
        im.image_key,
        mb.target_type,
        mb.target_entity_id,
        mb.status
      FROM marketing_banners mb
      JOIN images_metadata im ON im.id = mb.image_id
      WHERE mb.id = :bannerId  
    `,
      { bannerId }
    );

    const row = rows[0];
    if (!row) {
      throw AppError.notFound("Banner not found");
    }

    return mapBannerDetail(row);
  }

  async create(trx: Knex.Transaction, input: BannerUpsertSchema, imageId: number) {
    await this.assertBannerImageExists(trx, imageId);

    const sortOrder = await this.getNextSortOrder(trx);

    const { title, placement, targetType, targetId, status } = input;

    await trx.raw(
      `
      INSERT INTO marketing_banners
        (title, placement, target_type, target_entity_id, status, sort_order, image_id)
      VALUES
        (:title, :placement, :targetType, :targetId, :status, :sortOrder, :imageId)  
    `,
      { title, placement, targetType, targetId, status, sortOrder, imageId }
    );
  }

  async update(trx: Knex.Transaction, bannerId: number, input: BannerUpsertSchema, imageId: number) {
    await this.assertBannerImageExists(trx, imageId);

    const { title, placement, targetType, targetId, status } = input;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    UPDATE marketing_banners
    SET
      title = :title,
      placement = :placement,
      target_type = :targetType,
      target_entity_id = :targetId,
      status = :status,
      image_id = :imageId
    WHERE id = :bannerId
    RETURNING id
    `,
      {
        bannerId,
        title,
        placement,
        targetType,
        targetId,
        status,
        imageId
      }
    );

    if (!rows.length) {
      throw AppError.notFound("Banner not found");
    }
  }

  private async buildCategoryUrl(categoryId: number): Promise<string> {
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

    return `/categories/${row.slug_path}`;
  }

  private async buildCollectionUrl(collectionId: number): Promise<string> {
    const { rows } = await db.raw<{ rows: { slug: string }[] }>(`SELECT slug FROM collections WHERE id = :id LIMIT 1`, { id: collectionId });

    const row = rows[0];
    if (!row) return "#";

    return `/collections/${row.slug}`;
  }

  async reorderBanner(trx: Knex.Transaction, input: BannerReorderSchema) {
    const ids = input.map((i) => i.id);

    const cases = input.map((i) => `WHEN ${i.id} THEN ${i.sortOrder}`).join(" ");

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
        UPDATE marketing_banners
          SET sort_order = CASE id
          ${cases}
        END
        WHERE id = ANY(:ids)
        RETURNING id
        `,
      { ids }
    );

    if (!rows.length) {
      throw AppError.notFound("Banner not found or invalid collection");
    }
  }

  async remove(bannerId: number) {
    const { rows } = await db.raw<{ rows: { id: number }[] }>(
      `
          DELETE FROM marketing_banners
          WHERE id = :bannerId
          RETURNING id  
        `,
      { bannerId }
    );

    if (!rows.length) {
      throw AppError.notFound("Banner not found");
    }
  }

  async getBannerImages(qParams: BannerImagesQueryParamsSchema) {
    const { page, limit, sortBy, sortDir } = qParams;

    const bindings: any[] = [];

    const SORT_MAP: Record<string, string> = {
      created_at: "created_at"
    };

    const sortColumn = SORT_MAP[sortBy] ?? SORT_MAP.created_at;
    const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

    const offset = (page - 1) * limit;
    bindings.push(limit, offset);

    const sql = `
      SELECT id, image_key, width, height
      FROM images_metadata
      WHERE context = '${IMAGE_CONTEXT.BANNER}'
        ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const { rows } = await db.raw<{ rows: BannerImageRow[] }>(sql, bindings);

    const { rows: totalRows } = await db.raw<{ rows: { total: number }[] }>(
      `
        SELECT COUNT(*)::int AS total FROM images_metadata
        WHERE context = :context
    `,
      { context: IMAGE_CONTEXT.BANNER }
    );

    const totalRow = totalRows[0];
    if (!totalRow) {
      throw AppError.internal("Cannot get total images_metadata");
    }

    const images = mapBannerImages(rows);
    return { images, total: totalRow.total };
  }

  async snapShotBannerImage(imageId: number) {
    const { rows } = await db.raw<{ rows: { id: number; image_key: string }[] }>(
      `
      SELECT id, image_key FROM images_metadata
      WHERE id = :imageId AND context = :context  
    `,
      { imageId, context: IMAGE_CONTEXT.BANNER }
    );

    const row = rows[0];
    if (!row) {
      throw AppError.notFound("Banner image not found");
    }

    return row;
  }

  async removeBannerImageMetadata(imageId: number) {
    await db.raw<{ rows: { id: number }[] }>(
      `
          DELETE FROM images_metadata
          WHERE id = :imageId
            AND context = :context
        `,
      { imageId, context: IMAGE_CONTEXT.BANNER }
    );
  }

  async insertBannerImage(trx: Knex.Transaction, payload: ImagePayload) {
    const { imageKey, originalFileName, mimeType, size, width, height, originalAvailable } = payload;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      INSERT INTO images_metadata
        (image_key, original_file_name, mime_type, file_size, width, height, original_available, context)
      VALUES
        (:imageKey, :originalFileName, :mimeType, :size, :width, :height, :originalAvailable, :context) 
      RETURNING id
    `,
      {
        imageKey,
        originalFileName,
        mimeType,
        size,
        width,
        height,
        originalAvailable,
        context: IMAGE_CONTEXT.BANNER
      }
    );

    const row = rows[0];

    if (!row) {
      logger.error("Insert images_metadata returned no rows");
      throw AppError.internal();
    }

    return row.id;
  }

  async assertBannerImageExists(trx: Knex.Transaction, imageId: number) {
    const { rows } = await trx.raw<{ rows: unknown[] }>(
      `
      SELECT 1
      FROM images_metadata
      WHERE id = :imageId
        AND context = :context
      LIMIT 1
    `,
      { imageId, context: IMAGE_CONTEXT.BANNER }
    );

    if (!rows.length) {
      throw AppError.notFound("Banner image not found");
    }
  }

  private async getNextSortOrder(trx: Knex.Transaction): Promise<number> {
    const { rows } = await trx.raw<{ rows: { max: number | null }[] }>(
      `
        SELECT MAX(sort_order) AS max
        FROM marketing_banners
      `
    );

    return (rows[0]?.max ?? -1) + 1;
  }
}
