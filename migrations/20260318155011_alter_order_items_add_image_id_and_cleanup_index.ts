import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. DROP useless index
  await knex.raw(`
    DROP INDEX IF EXISTS idx_order_items_image_key;
  `);

  // 2. ADD image_id column
  await knex.raw(`
    ALTER TABLE order_items
    ADD COLUMN image_id BIGINT NULL;
  `);

  // 3. ADD FK (SET NULL)
  await knex.raw(`
    ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_image
    FOREIGN KEY (image_id)
    REFERENCES images_metadata(id)
    ON DELETE SET NULL;
  `);

  // 4. ADD index for cleanup
  await knex.raw(`
    CREATE INDEX idx_order_items_image_id
    ON order_items(image_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  // drop FK
  await knex.raw(`
    ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS fk_order_items_image;
  `);

  // drop index image_id
  await knex.raw(`
    DROP INDEX IF EXISTS idx_order_items_image_id;
  `);

  // drop column
  await knex.raw(`
    ALTER TABLE order_items
    DROP COLUMN IF EXISTS image_id;
  `);

  // get back old index
  await knex.raw(`
    CREATE INDEX idx_order_items_image_key
    ON order_items(image_key);
  `);
}
