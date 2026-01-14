import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_options (
      id BIGSERIAL PRIMARY KEY,
      product_variant_id BIGINT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL
  )
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variant_options`);
}
