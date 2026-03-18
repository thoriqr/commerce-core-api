import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE orders
    ADD COLUMN expires_at TIMESTAMPTZ NULL;
  `);

  await knex.raw(`
    CREATE INDEX idx_orders_expires_at
    ON orders(expires_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_expires_at;
  `);

  await knex.raw(`
    ALTER TABLE orders
    DROP COLUMN IF EXISTS expires_at;
  `);
}
