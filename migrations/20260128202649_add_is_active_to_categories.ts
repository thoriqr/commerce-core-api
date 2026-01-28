import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    DROP COLUMN is_active
  `);
}
