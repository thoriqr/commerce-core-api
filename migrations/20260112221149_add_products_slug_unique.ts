import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    ADD CONSTRAINT uq_products_slug
    UNIQUE (slug)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    DROP CONSTRAINT uq_products_slug
  `);
}
