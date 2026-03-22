import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE warehouses (
      id bigserial PRIMARY KEY,
      name varchar(100) NOT NULL,

      shipping_city_id int4 NOT NULL,
      shipping_city_name varchar(120) NOT NULL,

      shipping_province_id int4 NOT NULL,
      shipping_province_name varchar(120) NOT NULL,

      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz NULL
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_warehouses_city_id
    ON warehouses (shipping_city_id);
  `);

  await knex.raw(`
    CREATE TRIGGER trg_warehouses_set_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_warehouses_updated_at
    ON warehouses;
  `);

  await knex.raw(`
    DROP TABLE IF EXISTS warehouses;
  `);
}
