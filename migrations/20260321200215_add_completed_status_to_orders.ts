import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_status_chk
  `);

  await knex.raw(`
    ALTER TABLE orders
    ADD CONSTRAINT orders_status_chk
    CHECK (
      status IN (
        'PENDING',
        'PROCESSING',
        'CANCELLED',
        'COMPLETED'
      )
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_status_chk
  `);

  await knex.raw(`
    ALTER TABLE orders
    ADD CONSTRAINT orders_status_chk
    CHECK (
      status IN (
        'PENDING',
        'PROCESSING',
        'CANCELLED'
      )
    )
  `);
}
