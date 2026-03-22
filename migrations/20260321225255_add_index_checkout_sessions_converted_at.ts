import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_checkout_sessions_converted_at
    ON checkout_sessions (converted_at)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_checkout_sessions_converted_at
  `);
}
