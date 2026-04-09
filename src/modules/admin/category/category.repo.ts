import { Knex } from "knex";
import { CategoryReorderSchema, CategoryUpdateSchema, CategoryUpsertSchema } from "./category.schema";
import { db } from "@/infra/db/knex";
import { CategoryDetailRow, CategoryFlatRow, CategoryParentRow, CategoryRow } from "./category.types";
import { AppError } from "@/errors/app-error";
import { mapCategoryDetail, mapCategoryFlat, mapCategoryParents, mapCategoryParentTree } from "./category.mapper";
import { BANNER_TARGET_TYPE } from "@/shared/banner/banner.constants";
import { logger } from "@/libs/logger";

export class CategoryRepo {
  async getById(id: number) {
    const { rows } = await db.raw<{ rows: CategoryDetailRow[] }>(
      `
      SELECT id, parent_id, name, slug, description, sort_order, status FROM categories WHERE id =:id
    `,
      { id }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Category not found");
    }

    return mapCategoryDetail(row);
  }

  async getAllParent() {
    const { rows } = await db.raw<{ rows: CategoryParentRow[] }>(`
      SELECT id, parent_id, name, slug, sort_order, status
      FROM categories WHERE parent_id IS NULL
      ORDER BY sort_order ASC, id ASC 
    `);

    return mapCategoryParents(rows);
  }

  async getParentTree(parentId: number) {
    // ambil id_path parent dulu
    const { rows: parentRows } = await db.raw<{ rows: { id_path: string }[] }>(
      `
      SELECT id_path
      FROM categories
      WHERE id = :parentId
    `,
      { parentId }
    );

    const parentRow = parentRows[0];

    if (!parentRow) {
      throw AppError.notFound("Category not found");
    }

    const rootPath = parentRow.id_path;
    const rootPrefix = `${rootPath}/%`;

    // ambil subtree pakai id_path
    const { rows } = await db.raw<{ rows: CategoryRow[] }>(
      `
      SELECT
        id,
        parent_id,
        name,
        slug,
        sort_order,
        status
      FROM categories
      WHERE id_path = :rootPath
         OR id_path LIKE :rootPrefix
      ORDER BY id_path ASC
    `,
      {
        rootPath,
        rootPrefix
      }
    );

    const tree = mapCategoryParentTree(rows);

    if (!tree) {
      throw AppError.notFound("Category not found");
    }

    return tree;
  }

  async getFlatForProduct() {
    const { rows } = await db.raw<{ rows: CategoryFlatRow[] }>(`
    SELECT
      c.id,
      CASE
        WHEN p2.id IS NOT NULL THEN p2.name || ' / ' || p1.name || ' / ' || c.name
        WHEN p1.id IS NOT NULL THEN p1.name || ' / ' || c.name
        ELSE c.name
      END AS path,
      array_length(string_to_array(c.id_path, '/'), 1) AS depth
    FROM categories c
    LEFT JOIN categories p1 ON p1.id = c.parent_id
    LEFT JOIN categories p2 ON p2.id = p1.parent_id
    WHERE array_length(string_to_array(c.id_path, '/'), 1) <= 3
    ORDER BY c.id_path;
  `);

    return mapCategoryFlat(rows);
  }

  async create(trx: Knex.Transaction, input: CategoryUpsertSchema, slug: string) {
    await this.assertMaxDepth(trx, input.parentId);

    const sortOrder = await this.getNextSortOrder(trx, input.parentId);

    const { name, description, parentId, status } = input;

    // insert dulu
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    INSERT INTO categories
      (name, slug, description, parent_id, sort_order, status, id_path, slug_path)
    VALUES
      (:name, :slug, :description, :parentId, :sortOrder, :status, '', '')
    RETURNING id
    `,
      {
        name,
        slug,
        description: description ?? null,
        parentId,
        sortOrder,
        status
      }
    );

    const row = rows[0];
    if (!row) {
      logger.error("Insert to categories returning no rows");
      throw AppError.internal();
    }

    const newId = row.id;

    // hitung id_path & slug_path
    let idPath: string;
    let slugPath: string;

    if (!parentId) {
      // root
      idPath = String(newId);
      slugPath = slug;
    } else {
      const { rows: parentRows } = await trx.raw<{
        rows: { id_path: string; slug_path: string }[];
      }>(
        `
      SELECT id_path, slug_path
      FROM categories
      WHERE id = :parentId
      `,
        { parentId }
      );

      const parent = parentRows[0];

      if (!parent) {
        throw AppError.badRequest("Invalid parent category");
      }

      idPath = `${parent.id_path}/${newId}`;
      slugPath = `${parent.slug_path}/${slug}`;
    }

    // update id_path + slug_path
    await trx.raw(
      `
    UPDATE categories
    SET id_path = :idPath,
        slug_path = :slugPath
    WHERE id = :id
    `,
      {
        idPath,
        slugPath,
        id: newId
      }
    );
  }

  async update(trx: Knex.Transaction, categoryId: number, input: CategoryUpdateSchema, slug: string) {
    const { name, description, status } = input;

    // Ambil slug_path lama
    const { rows: existingRows } = await trx.raw<{
      rows: { slug_path: string }[];
    }>(
      `
    SELECT slug_path
    FROM categories
    WHERE id = :categoryId
    `,
      { categoryId }
    );

    const existing = existingRows[0];
    if (!existing) {
      throw AppError.notFound("Category not found");
    }

    const oldSlugPath = existing.slug_path;

    // Update basic fields + slug
    await trx.raw(
      `
    UPDATE categories
    SET name = :name,
        description = :description,
        slug = :slug,
        status = :status
    WHERE id = :categoryId
    `,
      {
        name,
        description: description ?? null,
        slug,
        status,
        categoryId
      }
    );

    // Ambil parent slug_path untuk hitung slug_path baru
    const { rows: parentRows } = await trx.raw<{
      rows: { parent_id: number | null; parent_slug_path: string | null }[];
    }>(
      `
    SELECT c.parent_id,
           p.slug_path AS parent_slug_path
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id
    WHERE c.id = :categoryId
    `,
      { categoryId }
    );

    const parent = parentRows[0];

    if (!parent) {
      logger.error("Category parent lookup failed unexpectedly", {
        categoryId
      });

      throw AppError.internal();
    }

    let newSlugPath: string;

    if (!parent.parent_id) {
      newSlugPath = slug;
    } else {
      newSlugPath = `${parent.parent_slug_path}/${slug}`;
    }

    // Update current category slug_path
    await trx.raw(
      `
    UPDATE categories
    SET slug_path = :newSlugPath
    WHERE id = :categoryId
    `,
      {
        newSlugPath,
        categoryId
      }
    );

    // Update subtree slug_path
    await trx.raw(
      `
    UPDATE categories
    SET slug_path = regexp_replace(
      slug_path,
      '^' || :oldSlugPath,
      :newSlugPath
    )
    WHERE slug_path LIKE :pattern
      AND id <> :categoryId
    `,
      {
        oldSlugPath,
        newSlugPath,
        pattern: `${oldSlugPath}/%`,
        categoryId
      }
    );
  }

  async reorderCategory(trx: Knex.Transaction, parentId: number, input: CategoryReorderSchema) {
    const ids = input.map((i) => i.id);

    const cases = input.map((i) => `WHEN ${i.id} THEN ${i.sortOrder}`).join(" ");

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      UPDATE categories
        SET sort_order = CASE id
        ${cases}
      END
      WHERE parent_id IS NOT DISTINCT FROM :parentId
        AND id = ANY(:ids)
      RETURNING id
      `,
      { parentId, ids }
    );

    if (rows.length !== input.length) {
      throw AppError.badRequest("Some categories do not belong to this parent");
    }
  }

  async remove(categoryId: number) {
    const { rows: bannerRows } = await db.raw<{ rows: { id: number }[] }>(
      `
          SELECT 1
          FROM marketing_banners
          WHERE target_type = :targetType
            AND target_entity_id = :categoryId
          LIMIT 1
          `,
      { targetType: BANNER_TARGET_TYPE.CATEGORY, categoryId }
    );

    if (bannerRows.length > 0) {
      throw AppError.badRequest("Category is still used by a banner");
    }

    const { rows } = await db.raw<{ rows: { id: number }[] }>(
      `
      DELETE FROM categories
      WHERE id = :categoryId
      RETURNING id  
    `,
      { categoryId }
    );

    if (!rows.length) {
      throw AppError.notFound("Category not found");
    }
  }

  async findBaseId(id: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{ rows: { id: number; parent_id: number | null }[] }>(
      `
      SELECT id, parent_id FROM categories
      WHERE id = :id
    `,
      { id }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Category not found");
    }

    return row;
  }

  private async getNextSortOrder(trx: Knex.Transaction, parentId: number | null): Promise<number> {
    const { rows } = await trx.raw<{ rows: { max: number | null }[] }>(
      `
        SELECT MAX(sort_order) AS max
        FROM categories
        WHERE parent_id IS NOT DISTINCT FROM :parentId
      `,
      { parentId }
    );

    // kalau belum ada sibling → rows[0].max = null
    return (rows[0]?.max ?? -1) + 1;
  }

  async assertMaxDepth(trx: Knex.Transaction, parentId: number | null) {
    if (!parentId) return;

    const { rows } = await trx.raw<{ rows: { depth: number }[] }>(
      `
    SELECT array_length(string_to_array(id_path, '/'), 1) AS depth
    FROM categories
    WHERE id = :parentId
  `,
      { parentId }
    );

    const depth = rows[0]?.depth ?? 1;

    if (depth >= 3) {
      throw AppError.badRequest("Maximum category depth reached");
    }
  }
}
