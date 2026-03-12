import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_pvi_product_active
    ON product_variant_images (product_id, id)
    WHERE is_orphan = false
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_pvi_product_active
  `);
}
