import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_dimensions (
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL,

      CONSTRAINT fk_variant_dimensions_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variant_dimensions`);
}
