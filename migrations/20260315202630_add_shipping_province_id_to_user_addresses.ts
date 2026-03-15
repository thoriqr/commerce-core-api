import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user_addresses
    ADD COLUMN shipping_province_id INT4 NOT NULL;
  `);

  await knex.raw(`
    CREATE INDEX idx_user_addresses_shipping_province_id
    ON user_addresses (shipping_province_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_user_addresses_shipping_province_id;
  `);

  await knex.raw(`
    ALTER TABLE user_addresses
    DROP COLUMN IF EXISTS shipping_province_id;
  `);
}
