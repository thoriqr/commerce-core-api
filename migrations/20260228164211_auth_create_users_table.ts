import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE users (
      id              BIGSERIAL PRIMARY KEY,

      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT,

      role            TEXT NOT NULL DEFAULT 'USER',
      status          TEXT NOT NULL DEFAULT 'ACTIVE',

      display_name    TEXT,

      last_login_at   TIMESTAMPTZ,

      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT chk_users_role
        CHECK (role IN ('USER', 'ADMIN', 'SUPER')),

      CONSTRAINT chk_users_status
        CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED'))
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_users_role ON users(role);
  `);

  await knex.raw(`
    CREATE INDEX idx_users_status ON users(status);
  `);

  await knex.raw(`
    CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS users CASCADE;
  `);
}
