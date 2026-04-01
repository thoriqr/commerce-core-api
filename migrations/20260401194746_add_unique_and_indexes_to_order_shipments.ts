import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- enforce 1 order = 1 shipment
    ALTER TABLE order_shipments
    ADD CONSTRAINT uq_order_shipments_order UNIQUE (order_id);

    -- optimize join (order detail)
    CREATE INDEX idx_order_shipments_order_id_status
    ON order_shipments (order_id, status);

    -- optimize shipped/delivered queries (future admin filter)
    CREATE INDEX idx_order_shipments_status_shipped_at
    ON order_shipments (status, shipped_at);

    -- optional (tracking lookup)
    CREATE INDEX idx_order_shipments_tracking_number
    ON order_shipments (tracking_number);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE order_shipments
    DROP CONSTRAINT IF EXISTS uq_order_shipments_order;

    DROP INDEX IF EXISTS idx_order_shipments_order_id_status;
    DROP INDEX IF EXISTS idx_order_shipments_status_shipped_at;
    DROP INDEX IF EXISTS idx_order_shipments_tracking_number;
  `);
}
