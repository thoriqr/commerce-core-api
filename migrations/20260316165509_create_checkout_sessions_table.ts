import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE checkout_sessions (
      id BIGSERIAL PRIMARY KEY,

      user_id BIGINT NOT NULL,
      address_id BIGINT NOT NULL,

      courier_code VARCHAR(20) NOT NULL,
      courier_service VARCHAR(50) NOT NULL,
      courier_description VARCHAR(100),

      shipping_cost INTEGER NOT NULL,

      shipping_etd VARCHAR(50),

      subtotal INTEGER NOT NULL,
      total_weight INTEGER NOT NULL,
      total INTEGER NOT NULL,

      expires_at TIMESTAMPTZ NOT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ,

      CONSTRAINT checkout_sessions_user_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      CONSTRAINT checkout_sessions_address_fkey
        FOREIGN KEY (address_id)
        REFERENCES user_addresses(id)
        ON DELETE RESTRICT
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_checkout_sessions_user_id
    ON checkout_sessions(user_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_checkout_sessions_expires_at
    ON checkout_sessions(expires_at);
  `);

  await knex.raw(`
    CREATE TRIGGER trg_checkout_sessions_set_updated_at
    BEFORE UPDATE ON checkout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS checkout_sessions;
  `);
}
