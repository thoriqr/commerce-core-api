import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD COLUMN sort_order INT;

    CREATE INDEX idx_categories_parent_sort
    ON categories (parent_id, sort_order);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_categories_parent_sort;

    ALTER TABLE categories
    DROP COLUMN sort_order;
  `);
}
