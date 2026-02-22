import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_images
    DROP CONSTRAINT IF EXISTS uq_product_image_order;
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX uq_product_image_order_active
    ON product_images (product_id, sort_order)
    WHERE is_orphan = false;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS uq_product_image_order_active;
  `);

  await knex.raw(`
    ALTER TABLE product_images
    ADD CONSTRAINT uq_product_image_order
    UNIQUE (product_id, sort_order);
  `);
}
