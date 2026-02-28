import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE user_providers (
      id                BIGSERIAL PRIMARY KEY,

      user_id           BIGINT NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,

      provider          TEXT NOT NULL,

      provider_user_id  TEXT NOT NULL,

      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT chk_user_providers_provider
        CHECK (provider IN ('GOOGLE', 'GITHUB')),

      CONSTRAINT uq_provider_identity
        UNIQUE(provider, provider_user_id),

      CONSTRAINT uq_user_provider
        UNIQUE(user_id, provider)
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_user_providers_user_id
      ON user_providers(user_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS user_providers CASCADE;
  `);
}
