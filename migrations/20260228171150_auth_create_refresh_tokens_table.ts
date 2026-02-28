import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE refresh_tokens (
      id                BIGSERIAL PRIMARY KEY,

      user_id           BIGINT NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,

      token_hash        TEXT NOT NULL UNIQUE,

      expires_at        TIMESTAMPTZ NOT NULL,
      revoked_at        TIMESTAMPTZ,

      replaced_by_id    BIGINT
                        REFERENCES refresh_tokens(id)
                        ON DELETE SET NULL,

      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_refresh_user_id
      ON refresh_tokens(user_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_refresh_expires_at
      ON refresh_tokens(expires_at);
  `);

  await knex.raw(`
    CREATE INDEX idx_refresh_user_active
      ON refresh_tokens(user_id)
      WHERE revoked_at IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS refresh_tokens CASCADE;
  `);
}
