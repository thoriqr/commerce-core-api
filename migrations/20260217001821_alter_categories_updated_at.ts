import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1️⃣ Backfill null values
  await knex.raw(`
    UPDATE categories
    SET updated_at = now()
    WHERE updated_at IS NULL
  `);

  // 2️⃣ Set default + not null
  await knex.raw(`
    ALTER TABLE categories
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL
  `);

  // 3️⃣ Create trigger
  await knex.raw(`
    CREATE TRIGGER trg_categories_set_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_categories_set_updated_at
    ON categories
  `);

  await knex.raw(`
    ALTER TABLE categories
    ALTER COLUMN updated_at DROP NOT NULL,
    ALTER COLUMN updated_at DROP DEFAULT
  `);
}
