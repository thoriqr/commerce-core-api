import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
      ALTER COLUMN address_id DROP NOT NULL,
      ALTER COLUMN courier_code DROP NOT NULL,
      ALTER COLUMN courier_service DROP NOT NULL,
      ALTER COLUMN courier_description DROP NOT NULL,
      ALTER COLUMN shipping_cost DROP NOT NULL,
      ALTER COLUMN shipping_etd DROP NOT NULL,
      ALTER COLUMN subtotal DROP NOT NULL,
      ALTER COLUMN total_weight DROP NOT NULL,
      ALTER COLUMN total DROP NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
      ALTER COLUMN address_id SET NOT NULL,
      ALTER COLUMN courier_code SET NOT NULL,
      ALTER COLUMN courier_service SET NOT NULL,
      ALTER COLUMN shipping_cost SET NOT NULL,
      ALTER COLUMN subtotal SET NOT NULL,
      ALTER COLUMN total_weight SET NOT NULL,
      ALTER COLUMN total SET NOT NULL;
  `);
}
