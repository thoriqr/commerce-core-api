import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user_providers
      ADD COLUMN provider_email TEXT NULL,
      ADD COLUMN provider_display_name TEXT NULL,
      ADD COLUMN provider_avatar_url TEXT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user_providers
      DROP COLUMN IF EXISTS provider_avatar_url,
      DROP COLUMN IF EXISTS provider_display_name,
      DROP COLUMN IF EXISTS provider_email
  `);
}
