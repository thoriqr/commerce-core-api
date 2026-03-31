import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ADD COLUMN shipping_city_id int8,
    ADD COLUMN shipping_district_id int8;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP COLUMN IF EXISTS shipping_city_id,
    DROP COLUMN IF EXISTS shipping_district_id;
  `);
}
