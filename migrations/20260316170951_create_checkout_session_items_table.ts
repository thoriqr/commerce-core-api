import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE checkout_session_items (
      id BIGSERIAL PRIMARY KEY,

      checkout_session_id BIGINT NOT NULL,
      variant_id BIGINT NOT NULL,

      product_name VARCHAR(255) NOT NULL,

      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,

      weight INTEGER NOT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT checkout_session_items_session_fkey
        FOREIGN KEY (checkout_session_id)
        REFERENCES checkout_sessions(id)
        ON DELETE CASCADE
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_checkout_session_items_session_id
    ON checkout_session_items(checkout_session_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_checkout_session_items_variant_id
    ON checkout_session_items(variant_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS checkout_session_items;
  `);
}
