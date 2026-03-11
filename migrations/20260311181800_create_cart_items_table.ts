import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE cart_items (
      id bigserial PRIMARY KEY,
      cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
      quantity integer NOT NULL CHECK (quantity > 0),
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz
    );
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX uq_cart_items_cart_variant
    ON cart_items(cart_id, variant_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_cart_items_cart_id
    ON cart_items(cart_id);
  `);

  await knex.raw(`
    CREATE INDEX idx_cart_items_variant_id
    ON cart_items(variant_id);
  `);

  await knex.raw(`
    CREATE TRIGGER trg_cart_items_set_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS cart_items CASCADE
  `);
}
