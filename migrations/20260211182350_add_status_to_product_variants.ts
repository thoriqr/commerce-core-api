import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';
  `);

  await knex.raw(`
    ALTER TABLE product_variants
    ADD CONSTRAINT product_variants_status_check
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'));
  `);

  await knex.raw(`
    CREATE INDEX idx_product_variants_active
    ON product_variants (product_id)
    WHERE status = 'ACTIVE';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_product_variants_active;
  `);

  await knex.raw(`
    ALTER TABLE product_variants
    DROP CONSTRAINT IF EXISTS product_variants_status_check;
  `);

  await knex.raw(`
    ALTER TABLE product_variants
    DROP COLUMN IF EXISTS status;
  `);
}
