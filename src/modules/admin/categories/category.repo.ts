import { Knex } from "knex";
import { CategoryReorderSchema, CategoryUpsertSchema } from "./category.schema";
import { db } from "@/infra/db/knex";
import { CategoryDetailRow, CategoryFlatRow, CategoryParentRow, CategoryRow } from "./category.types";
import { AppError } from "@/errors/app-error";
import { mapCategoryDetail, mapCategoryFlat, mapCategoryParents, mapCategoryParentTree } from "./category.mapper";
import { BANNER_TARGET_TYPE } from "../marketing/banner.constants";

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
    const { rows } = await db.raw<{ rows: CategoryRow[] }>(
      `
      WITH RECURSIVE category_tree AS(
        -- anchor: self
        SELECT c.id, c.parent_id, c.name, c.slug, c.sort_order, c.status
        FROM categories c WHERE c.id = :parent_id

        UNION ALL
        -- recursive: children
        SELECT c2.id, c2.parent_id, c2.name, c2.slug, c2.sort_order, c2.status
        FROM categories c2
        JOIN category_tree ct
          ON c2.parent_id = ct.id
      )
      SELECT ct.id, ct.parent_id, ct.name, ct.slug, ct.sort_order, ct.status
      FROM category_tree ct
      ORDER BY
        ct.parent_id NULLS FIRST,
        ct.sort_order ASC, ct.id ASC
    `,
      { parent_id: parentId }
    );

    const tree = mapCategoryParentTree(rows);

    if (!tree) {
      throw AppError.notFound("Category not found");
    }

    return tree;
  }

  async getFlatForProduct() {
    const { rows } = await db.raw<{ rows: CategoryFlatRow[] }>(`
      WITH RECURSIVE category_tree AS (
        SELECT
        id,
        name,
        parent_id,
        status,
        ARRAY[sort_order] AS sort_path,
        name::text AS path,
        1 AS depth
      FROM categories
      WHERE parent_id IS NULL

      UNION ALL

        SELECT
        c.id,
        c.name,
        c.parent_id,
        c.status,
        ct.sort_path || c.sort_order,
        ct.path || ' / ' || c.name,
        ct.depth + 1
      FROM categories c
      JOIN category_tree ct
        ON c.parent_id = ct.id
      )

      SELECT
      id,
      path,
      depth
    FROM category_tree
    WHERE depth <= 3
    ORDER BY sort_path;
    `);

    return mapCategoryFlat(rows);
  }

  async create(trx: Knex.Transaction, input: CategoryUpsertSchema, slug: string) {
    await this.assertMaxDepth(trx, input.parentId);

    const sortOrder = await this.getNextSortOrder(trx, input.parentId);

    const { name, description, parentId, status } = input;

    await trx.raw(
      `
      INSERT INTO categories
        (name, slug, description, parent_id, sort_order, status)
      VALUES
        (:name, :slug, :description, :parentId, :sortOrder, :status)
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
  }

  async update(trx: Knex.Transaction, categoryId: number, input: CategoryUpsertSchema, slug: string) {
    const { name, description, status } = input;

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
