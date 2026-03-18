import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE orders
    ADD COLUMN cancelled_at TIMESTAMPTZ NULL,
    ADD COLUMN paid_at TIMESTAMPTZ NULL,
    ADD COLUMN completed_at TIMESTAMPTZ NULL;
  `);

  // Optional: index for worker & fast query
  await knex.raw(`
    CREATE INDEX idx_orders_cancelled_at
    ON orders(cancelled_at);
  `);

  await knex.raw(`
    CREATE INDEX idx_orders_paid_at
    ON orders(paid_at);
  `);

  await knex.raw(`
    CREATE INDEX idx_orders_completed_at
    ON orders(completed_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_completed_at;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_paid_at;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_orders_cancelled_at;
  `);

  await knex.raw(`
    ALTER TABLE orders
    DROP COLUMN IF EXISTS completed_at,
    DROP COLUMN IF EXISTS paid_at,
    DROP COLUMN IF EXISTS cancelled_at;
  `);
}
