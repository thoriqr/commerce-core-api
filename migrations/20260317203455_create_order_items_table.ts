import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE order_items (
      id BIGSERIAL PRIMARY KEY,

      order_id BIGINT NOT NULL,
      variant_id BIGINT NOT NULL,

      -- snapshot data
      product_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,

      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      weight INTEGER NOT NULL,

      -- nullable for non-variant product
      option_snapshot JSONB NULL DEFAULT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

      -- CHECK constraints (guard)
      CONSTRAINT order_items_qty_chk
        CHECK (quantity > 0),

      CONSTRAINT order_items_price_chk
        CHECK (price >= 0),

      CONSTRAINT order_items_weight_chk
        CHECK (weight >= 0)
    );
  `);

  // INDEXES
  await knex.raw(`
    CREATE INDEX idx_order_items_order_id
    ON order_items(order_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_order_items_variant_id
    ON order_items(variant_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS order_items;
  `);
}
