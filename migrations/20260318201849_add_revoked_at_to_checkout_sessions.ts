import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ADD COLUMN revoked_at TIMESTAMPTZ NULL;
  `);

  // query revoke / filtering index
  await knex.raw(`
    CREATE INDEX idx_checkout_sessions_revoked_at
    ON checkout_sessions(revoked_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_checkout_sessions_revoked_at;
  `);

  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP COLUMN IF EXISTS revoked_at;
  `);
}
