import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ADD COLUMN origin_name VARCHAR(100),
    ADD COLUMN origin_province_name VARCHAR(120),
    ADD COLUMN origin_city_name VARCHAR(120),
    ADD COLUMN origin_district_name VARCHAR(120),
    ADD COLUMN origin_postal_code VARCHAR(20)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP COLUMN IF EXISTS origin_name,
    DROP COLUMN IF EXISTS origin_province_name,
    DROP COLUMN IF EXISTS origin_city_name,
    DROP COLUMN IF EXISTS origin_district_name,
    DROP COLUMN IF EXISTS origin_postal_code
  `);
}
