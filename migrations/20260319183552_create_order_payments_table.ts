import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE order_payments (
      id BIGSERIAL PRIMARY KEY,

      order_id BIGINT NOT NULL,
      order_code VARCHAR(50) NOT NULL,

      transaction_id VARCHAR(100) NOT NULL,
      payment_type VARCHAR(50) NOT NULL,

      transaction_status VARCHAR(20) NOT NULL,
      fraud_status VARCHAR(20) NULL,

      gross_amount INT4 NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'IDR',

      payment_code VARCHAR(100) NULL,
      store VARCHAR(50) NULL,
      bank VARCHAR(50) NULL,

      transaction_time TIMESTAMPTZ NULL,
      settlement_time TIMESTAMPTZ NULL,

      raw_payload JSONB NOT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NULL,

      CONSTRAINT fk_order_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

      CONSTRAINT order_payments_status_chk CHECK (
        transaction_status IN (
          'capture',
          'settlement',
          'pending',
          'deny',
          'cancel',
          'expire',
          'failure',
          'refund',
          'partial_refund',
          'authorize'
        )
      )
    );
  `);

  // indexes
  await knex.raw(`
    CREATE INDEX idx_order_payments_order_id
    ON order_payments(order_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_order_payments_order_code
    ON order_payments(order_code);
  `);

  await knex.raw(`
    CREATE INDEX idx_order_payments_transaction_id
    ON order_payments(transaction_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_order_payments_status
    ON order_payments(transaction_status);
  `);

  // UNIQUE (idempotency)
  await knex.raw(`
    CREATE UNIQUE INDEX ux_order_payments_transaction_id
    ON order_payments(transaction_id);
  `);

  // updated_at trigger
  await knex.raw(`
    CREATE TRIGGER trg_order_payments_updated_at
    BEFORE UPDATE ON order_payments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_order_payments_updated_at ON order_payments;
  `);

  await knex.raw(`
    DROP TABLE IF EXISTS order_payments;
  `);
}
