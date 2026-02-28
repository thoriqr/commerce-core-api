import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE pending_verifications (
      id              BIGSERIAL PRIMARY KEY,

      user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
      email           TEXT NOT NULL,

      token_hash      TEXT NOT NULL,

      type            TEXT NOT NULL,

      expires_at      TIMESTAMPTZ NOT NULL,
      used_at         TIMESTAMPTZ,

      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT chk_pending_verifications_type
        CHECK (type IN (
          'REGISTER',
          'INVITE',
          'RESET_PASSWORD',
          'CHANGE_EMAIL'
        ))
    );
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX idx_pending_token_hash
    ON pending_verifications(token_hash);
  `);

  await knex.raw(`
    CREATE INDEX idx_pending_email
    ON pending_verifications(email);
  `);

  await knex.raw(`
    CREATE INDEX idx_pending_user_id
    ON pending_verifications(user_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_pending_expires_at
    ON pending_verifications(expires_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS pending_verifications CASCADE;
  `);
}
