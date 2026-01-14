import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variant_options
    ADD CONSTRAINT fk_variant_options_product_variant
    FOREIGN KEY (product_variant_id)
    REFERENCES product_variants(id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variant_options
    DROP CONSTRAINT fk_variant_options_product_variant
  `);
}
