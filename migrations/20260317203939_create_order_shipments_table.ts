import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE order_shipments (
      id BIGSERIAL PRIMARY KEY,

      order_id BIGINT NOT NULL,

      -- courier snapshot
      courier_code VARCHAR(20) NOT NULL,
      courier_name VARCHAR(50) NOT NULL,
      courier_service VARCHAR(50) NOT NULL,
      courier_description VARCHAR(100) NULL,

      -- delivery info
      shipping_etd VARCHAR(50) NULL,

      -- tracking
      tracking_number VARCHAR(100) NULL,

      -- shipment status
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

      -- timeline
      shipped_at TIMESTAMPTZ NULL,
      delivered_at TIMESTAMPTZ NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL,

      CONSTRAINT fk_order_shipments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

      -- CHECK constraint
      CONSTRAINT order_shipments_status_chk
        CHECK (
          status IN (
            'PENDING',
            'SHIPPED',
            'DELIVERED'
          )
        )
    );
  `);

  // INDEXES
  await knex.raw(`
    CREATE INDEX idx_order_shipments_order_id
    ON order_shipments(order_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_order_shipments_status
    ON order_shipments(status);
  `);

  // TRIGGER updated_at
  await knex.raw(`
    CREATE TRIGGER trg_order_shipments_set_updated_at
    BEFORE UPDATE ON order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS order_shipments;
  `);
}
