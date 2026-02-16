import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1️⃣ Backfill NULL updated_at
  await knex.raw(`
    UPDATE marketing_banners
    SET updated_at = created_at
    WHERE updated_at IS NULL
  `);

  // 2️⃣ Set default & NOT NULL
  await knex.raw(`
    ALTER TABLE marketing_banners
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL
  `);

  // 3️⃣ Create trigger
  await knex.raw(`
    CREATE TRIGGER trg_marketing_banners_set_updated_at
    BEFORE UPDATE ON marketing_banners
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_marketing_banners_set_updated_at
    ON marketing_banners
  `);

  await knex.raw(`
    ALTER TABLE marketing_banners
    ALTER COLUMN updated_at DROP NOT NULL,
    ALTER COLUMN updated_at DROP DEFAULT
  `);
}
