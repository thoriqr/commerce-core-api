import { Knex } from "knex";
import { CategoryReorderSchema, CategoryUpsertSchema } from "./category.schema";
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
    // 1️⃣ ambil id_path parent dulu
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

    // 2️⃣ ambil subtree pakai id_path
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

    // 1️⃣ Insert dulu dan ambil id
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    INSERT INTO categories
      (name, slug, description, parent_id, sort_order, status)
    VALUES
      (:name, :slug, :description, :parentId, :sortOrder, :status)
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

    // 2️⃣ Hitung id_path
    let idPath: string;

    if (!parentId) {
      // root
      idPath = String(newId);
    } else {
      const { rows } = await trx.raw<{ rows: { id_path: string }[] }>(`SELECT id_path FROM categories WHERE id = :parentId`, { parentId });

      const row = rows[0];

      if (!row) {
        logger.error("Get id_path categories returning no rows");
        throw AppError.internal();
      }

      const parentPath = row.id_path;

      idPath = `${parentPath}/${newId}`;
    }

    // 3️⃣ Update id_path
    await trx.raw(
      `
    UPDATE categories
    SET id_path = :idPath
    WHERE id = :id
    `,
      {
        idPath,
        id: newId
      }
    );
  }

  async update(trx: Knex.Transaction, categoryId: number, input: CategoryUpsertSchema, slug: string) {
    const { name, description, status, parentId } = input;

    if (parentId !== undefined) {
      throw AppError.badRequest("Changing parent is not supported yet");
    }

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      UPDATE categories
        SET name = :name, description = :description, slug = :slug, status = :status
      WHERE id = :categoryId
      RETURNING id
    `,
      { name, description: description ?? null, slug, status, categoryId }
    );

    if (!rows.length) {
      throw AppError.notFound("Category not found");
    }
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

    if (!rows.length) {
      throw AppError.notFound("Category not found or invalid parent");
    }
  }

  async remove(categoryId: number) {
    const { rows: bannerRows } = await db.raw<{ rows: { id: number }[] }>(
      `
          SELECT 1
          FROM marketing_banners
          WHERE target_type = :targetType
            AND target_id = :categoryId
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
    if (parentId === null) return; // root

    const { rows } = await trx.raw<{ rows: { depth: number }[] }>(
      `
    WITH RECURSIVE parent_chain AS (
      SELECT id, parent_id, 0 AS depth
      FROM categories
      WHERE id = :parentId

      UNION ALL

      SELECT c.id, c.parent_id, pc.depth + 1
      FROM categories c
      JOIN parent_chain pc
        ON c.id = pc.parent_id
    )
    SELECT MAX(depth) AS depth FROM parent_chain
    `,
      { parentId }
    );

    const parentDepth = rows[0]?.depth ?? 0;

    // parentDepth = 2 grandchild
    if (parentDepth >= 2) {
      throw AppError.badRequest("Maximum category depth reached");
    }
  }
}
