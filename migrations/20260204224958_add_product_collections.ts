import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_collections (
      product_id BIGINT NOT NULL,
      collection_id BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT pk_product_collections
        PRIMARY KEY (product_id, collection_id),

      CONSTRAINT fk_product_collections_product
        FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE CASCADE,

      CONSTRAINT fk_product_collections_collection
        FOREIGN KEY (collection_id)
        REFERENCES collections (id)
        ON DELETE CASCADE
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_collections`);
}
