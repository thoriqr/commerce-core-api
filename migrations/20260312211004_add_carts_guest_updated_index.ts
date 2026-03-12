import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_carts_guest_updated
    ON carts (updated_at)
    WHERE user_id IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_carts_guest_updated
  `);
}
