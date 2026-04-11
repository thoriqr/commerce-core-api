import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // enable extension
  await knex.raw(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  `);

  //  create GIN index for email search
  await knex.raw(`
    CREATE INDEX idx_users_email_trgm
    ON users
    USING gin (email gin_trgm_ops);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_users_email_trgm;
  `);
}
