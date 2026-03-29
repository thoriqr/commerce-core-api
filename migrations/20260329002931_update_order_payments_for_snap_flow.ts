import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // 1. drop NOT NULL constraint
    await trx.raw(`
      ALTER TABLE order_payments
      ALTER COLUMN transaction_id DROP NOT NULL,
      ALTER COLUMN payment_type DROP NOT NULL;
    `);

    // 2. drop existing unique index (if exist)
    await trx.raw(`
      DROP INDEX IF EXISTS ux_order_payments_transaction_id;
    `);

    // 3. create partial unique index (only when not null)
    await trx.raw(`
      CREATE UNIQUE INDEX ux_order_payments_transaction_id
      ON order_payments (transaction_id)
      WHERE transaction_id IS NOT NULL;
    `);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // 1. drop partial index
    await trx.raw(`
      DROP INDEX IF EXISTS ux_order_payments_transaction_id;
    `);

    // 2. revert NOT NULL constraint
    await trx.raw(`
      ALTER TABLE order_payments
      ALTER COLUMN transaction_id SET NOT NULL,
      ALTER COLUMN payment_type SET NOT NULL;
    `);

    // 3. recreate original unique index
    await trx.raw(`
      CREATE UNIQUE INDEX ux_order_payments_transaction_id
      ON order_payments (transaction_id);
    `);
  });
}
