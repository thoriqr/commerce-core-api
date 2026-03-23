import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    ADD COLUMN sold int4 NOT NULL DEFAULT 0;
  `);

  // optional index (for sorting "best selling")
  await knex.raw(`
    CREATE INDEX idx_product_variants_sold
    ON product_variants (sold DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_product_variants_sold;
  `);

  await knex.raw(`
    ALTER TABLE product_variants
    DROP COLUMN IF EXISTS sold;
  `);
}
