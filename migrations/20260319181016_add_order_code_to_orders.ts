import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE orders
    ADD COLUMN order_code VARCHAR(50) NOT NULL;
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX ux_orders_order_code
    ON orders(order_code);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS ux_orders_order_code;
  `);

  await knex.raw(`
    ALTER TABLE orders
    DROP COLUMN IF EXISTS order_code;
  `);
}
