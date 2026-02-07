import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE marketing_banners
    ADD COLUMN target_id BIGINT NOT NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_marketing_banners_target
    ON marketing_banners (target_type, target_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_marketing_banners_target
  `);

  await knex.raw(`
    ALTER TABLE marketing_banners
    DROP COLUMN target_id
  `);
}
