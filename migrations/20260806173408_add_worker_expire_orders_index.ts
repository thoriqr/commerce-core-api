import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_orders_worker_expire
    ON orders (expires_at ASC, id ASC)
    WHERE payment_status = 'UNPAID'
      AND status = 'PENDING';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_worker_expire;
  `);
}
