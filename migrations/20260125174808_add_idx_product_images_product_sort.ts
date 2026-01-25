import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_product_images_product_sort
    ON product_images (product_id, sort_order, id)
    WHERE is_orphan = false`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_product_images_product_sort`);
}
