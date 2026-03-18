import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE order_items
    ADD COLUMN product_id BIGINT NOT NULL;
  `);

  // (analytics / future query)
  await knex.raw(`
    CREATE INDEX idx_order_items_product_id
    ON order_items(product_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_order_items_product_id;
  `);

  await knex.raw(`
    ALTER TABLE order_items
    DROP COLUMN IF EXISTS product_id;
  `);
}
