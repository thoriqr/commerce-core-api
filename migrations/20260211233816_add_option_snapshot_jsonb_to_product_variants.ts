import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    ADD COLUMN option_snapshot JSONB NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    DROP COLUMN IF EXISTS option_snapshot;
  `);
}
