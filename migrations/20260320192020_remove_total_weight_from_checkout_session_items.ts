import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_session_items
    DROP COLUMN IF EXISTS total_weight;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_session_items
    ADD COLUMN total_weight int4;
  `);
}
