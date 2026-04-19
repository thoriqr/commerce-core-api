import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE warehouses
    ADD COLUMN shipping_district_id INT,
    ADD COLUMN shipping_district_name VARCHAR(120),
    ADD COLUMN postal_code VARCHAR(20)
  `);

  await knex.raw(`
    CREATE INDEX idx_warehouses_district_id
    ON warehouses (shipping_district_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_warehouses_district_id
  `);

  await knex.raw(`
    ALTER TABLE warehouses
    DROP COLUMN IF EXISTS shipping_district_id,
    DROP COLUMN IF EXISTS shipping_district_name,
    DROP COLUMN IF EXISTS postal_code
  `);
}
