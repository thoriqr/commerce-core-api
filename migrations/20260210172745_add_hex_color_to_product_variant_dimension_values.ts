import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variant_dimension_values
    ADD COLUMN hex_color text NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variant_dimension_values
    DROP COLUMN IF EXISTS hex_color;
  `);
}
