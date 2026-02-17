import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Backfill updated_at = created_at
  await knex.raw(`
    UPDATE products
    SET updated_at = created_at
    WHERE updated_at IS NULL
  `);

  // Set default + not null
  await knex.raw(`
    ALTER TABLE products
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL
  `);

  // Create trigger (function global set_updated_at())
  await knex.raw(`
    CREATE TRIGGER trg_products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_products_set_updated_at
    ON products
  `);

  await knex.raw(`
    ALTER TABLE products
    ALTER COLUMN updated_at DROP DEFAULT,
    ALTER COLUMN updated_at DROP NOT NULL
  `);
}
