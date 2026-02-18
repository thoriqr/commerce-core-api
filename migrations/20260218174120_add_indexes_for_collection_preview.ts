import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_collections_status_sort
    ON collections (status, sort_order, id);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_product_collections_collection
    ON product_collections (collection_id, product_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_collections_status_sort;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_product_collections_collection;
  `);
}
