import { Knex } from "knex";
import { BannerUpsertSchema } from "./banner.schema";
import { BannerDetailRow, BannerListRow, ImagePayload } from "./banner.types";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";
import { IMAGE_CONTEXT } from "@/constants/image-context";
import { db } from "@/infra/db/knex";
import { mapBannerDetail, mapBannerList } from "./banner.mapper";

const QUERY_TARGET_PLACEHOLDER = "__QUERY_TARGET_PENDING__";

export class BannerRepo {
  async getAll() {
    const { rows } = await db.raw<{ rows: BannerListRow[] }>(`
      SELECT 
       mb.id,
       mb.title,
       mb.placement,
       im.image_key,
       mb.target_type,
       mb.target_value,
       mb.is_active,
       mb.sort_order
       FROM marketing_banners mb
       JOIN images_metadata im ON im.id = mb.image_id
       ORDER BY mb.sort_order ASC, mb.id ASC
    `);

    return mapBannerList(rows);
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
        mb.target_id,
        mb.is_active
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

  async create(trx: Knex.Transaction, input: BannerUpsertSchema, imageId: number, targetValue: string | null) {
    await this.assertBannerImageExists(trx, imageId);

    const sortOrder = await this.getNextSortOrder(trx);

    const { title, placement, targetType, targetId, isActive } = input;

    await trx.raw(
      `
      INSERT INTO marketing_banners
        (title, placement, target_type, target_id, target_value, is_active, sort_order, image_id)
      VALUES
        (:title, :placement, :targetType, :targetId, :targetValue, :isActive, :sortOrder, :imageId)  
    `,
      { title, placement, targetType, targetId, targetValue: targetValue ?? QUERY_TARGET_PLACEHOLDER, isActive, sortOrder, imageId }
    );
  }

  async update(trx: Knex.Transaction, bannerId: number, input: BannerUpsertSchema, imageId: number, targetValue: string | null) {
    await this.assertBannerImageExists(trx, imageId);

    const { title, placement, targetType, targetId, isActive } = input;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    UPDATE marketing_banners
    SET
      title = :title,
      placement = :placement,
      target_type = :targetType,
      target_id = :targetId,
      target_value = :targetValue,
      is_active = :isActive,
      image_id = :imageId,
      updated_at = now()
    WHERE id = :bannerId
    RETURNING id
    `,
      {
        bannerId,
        title,
        placement,
        targetType,
        targetId,
        targetValue: targetValue ?? QUERY_TARGET_PLACEHOLDER,
        isActive,
        imageId
      }
    );

    if (!rows.length) {
      throw AppError.notFound("Banner not found");
    }
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

  async resolveTarget(trx: Knex.Transaction, targetType: BannerUpsertSchema["targetType"], targetId?: number) {
    // future: rule / query based
    // if (targetType === "query") {
    //   return null;
    // }

    // entity based targets MUST have targetId
    if (!targetId) {
      throw AppError.badRequest("targetId is required for this target type");
    }

    if (targetType === "category") {
      const slugPath = await this.resolveCategorySlugPath(trx, targetId);

      return slugPath;
    }

    if (targetType === "collection") {
      const slug = await this.resolveCollectionSlug(trx, targetId);

      return slug;
    }

    throw AppError.badRequest("Invalid target type");
  }

  async resolveCategorySlugPath(trx: Knex.Transaction, categoryId: number): Promise<string> {
    const { rows } = await trx.raw<{ rows: { slug_path: string }[] }>(
      `
    WITH RECURSIVE category_tree AS (
      SELECT id, slug, parent_id, slug::text AS slug_path
      FROM categories
      WHERE id = :id

      UNION ALL

      SELECT c.id, c.slug, c.parent_id, c.slug || '/' || ct.slug_path
      FROM categories c
      JOIN category_tree ct ON ct.parent_id = c.id
    )
    SELECT slug_path
    FROM category_tree
    WHERE parent_id IS NULL
    LIMIT 1
    `,
      { id: categoryId }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Category not found");
    }

    return row.slug_path;
  }

  async resolveCollectionSlug(trx: Knex.Transaction, collectionId: number): Promise<string> {
    const { rows } = await trx.raw<{ rows: { slug: string }[] }>(`SELECT slug FROM collections WHERE id = :id LIMIT 1`, { id: collectionId });
    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Collection not found");
    }

    return row.slug;
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
