import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS product_variant_options
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_options (
      id BIGSERIAL PRIMARY KEY,
      product_variant_id BIGINT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL
    );

    ALTER TABLE product_variant_options
    ADD CONSTRAINT fk_variant_options_product_variant
    FOREIGN KEY (product_variant_id)
    REFERENCES product_variants(id);
  `);
}
