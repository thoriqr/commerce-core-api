import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_order_items_worker_release_stock
    ON order_items (order_id, variant_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_order_items_worker_release_stock;
  `);
}
