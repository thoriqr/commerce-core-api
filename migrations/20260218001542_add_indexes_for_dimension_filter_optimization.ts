import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_variant_dimensions_normalized_name
    ON product_variant_dimensions (normalized_name);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_dimension_values_normalized_value
    ON product_variant_dimension_values (normalized_value);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_variant_dimensions_normalized_name;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_dimension_values_normalized_value;
  `);
}
