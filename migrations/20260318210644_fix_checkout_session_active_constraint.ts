import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. cleanup old
  await knex.raw(`
    UPDATE checkout_sessions
    SET revoked_at = NOW()
    WHERE
      converted_at IS NULL
      AND revoked_at IS NULL
      AND expires_at <= NOW();
  `);

  // 2. drop index
  await knex.raw(`
    DROP INDEX IF EXISTS ux_checkout_active_session;
  `);

  // 3. create unique index (FIXED LOGIC)
  await knex.raw(`
    CREATE UNIQUE INDEX ux_checkout_active_session
    ON checkout_sessions (user_id)
    WHERE
      converted_at IS NULL
      AND revoked_at IS NULL;
  `);

  // 4. optional: index  query active
  await knex.raw(`
    CREATE INDEX idx_checkout_sessions_active
    ON checkout_sessions(user_id)
    WHERE converted_at IS NULL AND revoked_at IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS ux_checkout_active_session;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_checkout_sessions_active;
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX ux_checkout_active_session
    ON checkout_sessions (user_id)
    WHERE converted_at IS NULL;
  `);
}
