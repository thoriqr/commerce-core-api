import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE orders (
      id BIGSERIAL PRIMARY KEY,

      user_id BIGINT NOT NULL,

      -- status order (lifecycle)
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

      -- payment status (summary)
      payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',

      -- snapshot totals
      subtotal INTEGER NOT NULL,
      shipping_cost INTEGER NOT NULL,
      total INTEGER NOT NULL,

      -- snapshot address
      recipient_name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      address_line TEXT NOT NULL,
      province_name VARCHAR(120) NOT NULL,
      city_name VARCHAR(120) NOT NULL,
      district_name VARCHAR(120) NOT NULL,
      postal_code VARCHAR(20) NULL,

      note TEXT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL,

      CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  // CHECK constraints
  await knex.raw(`
    ALTER TABLE orders
    ADD CONSTRAINT orders_status_chk
    CHECK (
      status IN (
        'PENDING',
        'PROCESSING',
        'CANCELLED'
      )
    );
  `);

  await knex.raw(`
    ALTER TABLE orders
    ADD CONSTRAINT orders_payment_status_chk
    CHECK (
      payment_status IN (
        'UNPAID',
        'PAID',
        'FAILED',
        'EXPIRED'
      )
    );
  `);

  // consistency guard (important)
  await knex.raw(`
    ALTER TABLE orders
    ADD CONSTRAINT orders_total_chk
    CHECK (total = subtotal + shipping_cost);
  `);

  // INDEXES
  await knex.raw(`
    CREATE INDEX idx_orders_user_created
    ON orders(user_id, created_at DESC);
  `);

  await knex.raw(`
    CREATE INDEX idx_orders_status
    ON orders(status);
  `);

  await knex.raw(`
    CREATE INDEX idx_orders_payment_status
    ON orders(payment_status);
  `);

  await knex.raw(`
    CREATE INDEX idx_orders_created_at
    ON orders(created_at DESC);
  `);

  // TRIGGER updated_at
  await knex.raw(`
    CREATE TRIGGER trg_orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS orders;
  `);
}
