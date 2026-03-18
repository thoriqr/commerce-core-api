import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
  ALTER TABLE checkout_sessions
  ADD COLUMN converted_at TIMESTAMPTZ NULL;
`);

  await knex.raw(`
  CREATE UNIQUE INDEX ux_checkout_active_session
  ON checkout_sessions(user_id)
  WHERE converted_at IS NULL;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS ux_checkout_active_session;
  `);

  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP COLUMN IF EXISTS converted_at;
  `);
}
