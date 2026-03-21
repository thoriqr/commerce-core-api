import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP COLUMN IF EXISTS total_weight
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ADD COLUMN total_weight INT4 NULL
  `);
}
