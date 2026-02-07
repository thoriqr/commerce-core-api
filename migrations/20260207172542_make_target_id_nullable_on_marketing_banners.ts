import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE marketing_banners
    ALTER COLUMN target_id DROP NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE marketing_banners
    ALTER COLUMN target_id SET NOT NULL
  `);
}
