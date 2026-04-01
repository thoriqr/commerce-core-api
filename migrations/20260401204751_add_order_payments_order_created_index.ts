import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- optimize latest payment lookup (LATERAL JOIN)
    CREATE INDEX idx_order_payments_order_created
    ON order_payments (order_id, created_at DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_order_payments_order_created;
  `);
}
