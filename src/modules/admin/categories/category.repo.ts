import { Knex } from "knex";
import { CategoryUpsertSchema } from "./category.schema";
import { db } from "@/infra/db/knex";
import { CategoryDetailRow, CategoryParentRow, CategoryRow } from "./category.types";
import { AppError } from "@/errors/app-error";
import { mapCategoryDetail, mapCategoryParents, mapCategoryParentTree } from "./category.mapper";

export class CategoryRepo {
  async getById(id: number) {
    const { rows } = await db.raw<{ rows: CategoryDetailRow[] }>(
      `
      SELECT id, parent_id, name, slug, description, sort_order FROM categories WHERE id =:id
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
      SELECT id, parent_id, name, slug, sort_order
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
        SELECT c.id, c.parent_id, c.name, c.slug, c.sort_order
        FROM categories c WHERE c.id = :parent_id

        UNION ALL
        -- recursive: children
        SELECT c2.id, c2.parent_id, c2.name, c2.slug, c2.sort_order
        FROM categories c2
        JOIN category_tree ct
          ON c2.parent_id = ct.id
      )
      SELECT ct.id, ct.parent_id, ct.name, ct.slug, ct.sort_order
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

  async create(trx: Knex.Transaction, input: CategoryUpsertSchema, slug: string) {
    await this.assertMaxDepth(trx, input.parentId);

    const sortOrder = await this.getNextSortOrder(trx, input.parentId);

    const { name, description, parentId } = input;

    await trx.raw(
      `
      INSERT INTO categories
        (name, slug, description, parent_id, sort_order)
      VALUES
        (:name, :slug, :description, :parentId, :sortOrder)
    `,
      {
        name,
        slug,
        description: description ?? null,
        parentId,
        sortOrder
      }
    );
  }

  async update(trx: Knex.Transaction, input: CategoryUpsertSchema, slug: string) {
    await this.assertMaxDepth(trx, input.parentId);

    const sortOrder = await this.getNextSortOrder(trx, input.parentId);

    const { name, description, parentId } = input;
  }

  async remove() {}

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
