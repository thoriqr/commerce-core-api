import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE user_addresses (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,

      label VARCHAR(50),

      recipient_name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NOT NULL,

      address_line TEXT NOT NULL,

      province_name VARCHAR(120) NOT NULL,
      city_name VARCHAR(120) NOT NULL,
      district_name VARCHAR(120),
      subdistrict_name VARCHAR(120),
      postal_code VARCHAR(20),

      country CHAR(2) NOT NULL DEFAULT 'ID',

      shipping_city_id INT NOT NULL,
      shipping_district_id INT,

      is_default BOOLEAN NOT NULL DEFAULT false,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ,

      CONSTRAINT user_addresses_user_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_user_addresses_user_id
    ON user_addresses(user_id);
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX uq_user_addresses_default
    ON user_addresses(user_id)
    WHERE is_default = true;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_user_addresses_set_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_user_addresses_set_updated_at ON user_addresses;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS uq_user_addresses_default;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_user_addresses_user_id;
  `);

  await knex.raw(`
    DROP TABLE IF EXISTS user_addresses;
  `);
}
