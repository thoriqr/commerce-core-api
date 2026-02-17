import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Backfill updated_at
  await knex.raw(`
    UPDATE product_variants
    SET updated_at = created_at
    WHERE updated_at IS NULL;
  `);

  // Set NOT NULL + default
  await knex.raw(`
    ALTER TABLE product_variants
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL;
  `);

  // Create trigger (reuse global set_updated_at())
  await knex.raw(`
    CREATE TRIGGER trg_product_variants_set_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);

  // Extra indexes for store queries

  // Fast filter ACTIVE by product
  await knex.raw(`
    CREATE INDEX idx_product_variants_product_status
    ON product_variants (product_id, status);
  `);

  // Optional: primary variant fast lookup
  await knex.raw(`
    CREATE INDEX idx_product_variants_primary
    ON product_variants (product_id)
    WHERE is_primary = true;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_product_variants_set_updated_at
    ON product_variants;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_product_variants_product_status;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_product_variants_primary;
  `);

  await knex.raw(`
    ALTER TABLE product_variants
    ALTER COLUMN updated_at DROP DEFAULT,
    ALTER COLUMN updated_at DROP NOT NULL;
  `);
}
