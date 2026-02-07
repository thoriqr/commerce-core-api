import { Knex } from "knex";
import { BannerUpsertSchema } from "./banner.schema";
import { ImagePayload } from "./banner.types";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";
import { IMAGE_CONTEXT } from "@/constants/image-context";

export class BannerRepo {
  async create(trx: Knex.Transaction, input: Omit<BannerUpsertSchema, "targetValue"> & { targetValue: string }, imageId: number) {
    await this.assertBannerImageExists(trx, imageId);

    const sortOrder = await this.getNextSortOrder(trx);

    const { title, placement, targetType, targetValue, isActive } = input;

    await trx.raw(
      `
      INSERT INTO marketing_banners
        (title, placement, target_type, target_value, is_active, sort_order, image_id)
      VALUES
        (:title, :placement, :targetType, :targetValue, :isActive, :sortOrder, :imageId)  
    `,
      { title, placement, targetType, targetValue, isActive, sortOrder, imageId }
    );
  }

  async update(trx: Knex.Transaction, bannerId: number, input: Omit<BannerUpsertSchema, "targetValue"> & { targetValue: string }, imageId: number) {
    await this.assertBannerImageExists(trx, imageId);

    const { title, placement, targetType, targetValue, isActive } = input;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    UPDATE marketing_banners
    SET
      title = :title,
      placement = :placement,
      target_type = :targetType,
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
        targetValue,
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

  async resolveTarget(trx: Knex.Transaction, targetType: BannerUpsertSchema["targetType"], targetValue: number) {
    if (targetType === "category") {
      const slugPath = await this.resolveCategorySlugPath(trx, targetValue);

      return slugPath;
    }

    if (targetType === "collection") {
      const slug = await this.resolveCollectionSlug(trx, targetValue);

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
