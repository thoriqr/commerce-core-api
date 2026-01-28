import { Knex } from "knex";
import { CategoryUpsertSchema } from "./category.schema";

export class CategoryRepo {
  async getAll() {}

  async getDetailById() {}

  async create(trx: Knex.Transaction, input: CategoryUpsertSchema, slug: string) {
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

  async update() {}

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
}
