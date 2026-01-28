import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    DROP CONSTRAINT uq_categories_slug
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD CONSTRAINT uq_categories_slug
    UNIQUE (slug)
  `);
}
