import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variants (
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL,
      price BIGINT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      weight INTEGER NOT NULL,
      sku TEXT,
      currency CHAR(3) NOT NULL DEFAULT 'IDR',
      weight_unit CHAR(3) NOT NULL DEFAULT 'g',
      is_primary BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ
  )
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variants`);
}
