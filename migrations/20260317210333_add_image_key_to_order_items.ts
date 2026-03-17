import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE order_items
    ADD COLUMN image_key TEXT NULL;
  `);

  await knex.raw(`
    CREATE INDEX idx_order_items_image_key
    ON order_items(image_key);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE order_items
    DROP COLUMN IF EXISTS image_key;
  `);
}
