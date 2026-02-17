import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 🔹 products (composite index)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_products_status_category
    ON products (status, category_id);
  `);

  // 🔹 product_variant_option_values (pivot optimizations)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_pvov_variant
    ON product_variant_option_values (variant_id);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_pvov_dimension_value
    ON product_variant_option_values (dimension_id, value_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_products_status_category;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_pvov_variant;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_pvov_dimension_value;
  `);
}
