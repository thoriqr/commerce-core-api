import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Add Column (nullable first)
  await knex.raw(`
    ALTER TABLE images_metadata
    ADD COLUMN context TEXT
  `);

  // 2. Backfill data existing
  await knex.raw(`
    UPDATE images_metadata
    SET context = 'product'
    WHERE context IS NULL
  `);

  // 3. Add CHECK constraint
  await knex.raw(`
    ALTER TABLE images_metadata
    ADD CONSTRAINT chk_images_metadata_context
    CHECK (context IN ('product', 'product_variant', 'banner'))
  `);

  // 4. Set NOT NULL
  await knex.raw(`
    ALTER TABLE images_metadata
    ALTER COLUMN context SET NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE images_metadata
    DROP CONSTRAINT IF EXISTS chk_images_metadata_context
  `);

  await knex.raw(`
    ALTER TABLE images_metadata
    DROP COLUMN IF EXISTS context
  `);
}
