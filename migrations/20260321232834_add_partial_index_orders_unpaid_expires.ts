import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_orders_unpaid_expires
    ON orders (expires_at)
    WHERE payment_status = 'UNPAID'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_unpaid_expires
  `);
}
