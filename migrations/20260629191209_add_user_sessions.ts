import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE user_sessions (
      id              BIGSERIAL PRIMARY KEY,

      user_id         BIGINT NOT NULL
                      REFERENCES users(id) ON DELETE CASCADE,

      client          TEXT NOT NULL,
      user_agent      TEXT,
      ip_address      TEXT,

      last_used_at    TIMESTAMPTZ,
      revoked_at      TIMESTAMPTZ,

      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT chk_user_sessions_client
        CHECK (client IN ('web', 'mobile'))
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_user_sessions_user_active
    ON user_sessions(user_id)
    WHERE revoked_at IS NULL;
  `);

  await knex.raw(`
    CREATE INDEX idx_user_sessions_last_used_at
    ON user_sessions(last_used_at);
  `);

  await knex.raw(`
    CREATE TRIGGER trg_user_sessions_set_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);

  await knex.raw(`
    ALTER TABLE refresh_tokens
    ADD COLUMN session_id BIGINT NOT NULL
      REFERENCES user_sessions(id) ON DELETE CASCADE;
  `);

  await knex.raw(`
    CREATE INDEX idx_refresh_tokens_session_active
    ON refresh_tokens(session_id)
    WHERE revoked_at IS NULL;
  `);

  await knex.raw(`
    CREATE INDEX idx_refresh_tokens_session_created
    ON refresh_tokens(session_id, created_at DESC);
  `);
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_refresh_tokens_session_created;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_refresh_tokens_session_active;
  `);

  await knex.raw(`
    ALTER TABLE refresh_tokens
    DROP COLUMN IF EXISTS session_id;
  `);

  await knex.raw(`
    DROP TABLE IF EXISTS user_sessions CASCADE;
  `);
}
