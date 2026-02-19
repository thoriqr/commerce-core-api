import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_products_name_fts
    ON products
    USING GIN (to_tsvector('simple', name));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_products_name_fts;
  `);
}
