import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_refresh_user_id;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX idx_refresh_user_id
    ON refresh_tokens (user_id);
  `);
}
