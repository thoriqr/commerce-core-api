import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- optimize admin order listing (filter + sort)
    CREATE INDEX idx_orders_status_payment_created
    ON orders (status, payment_status, created_at DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_status_payment_created;
  `);
}
