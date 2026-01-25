import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_images(
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL,
      image_id BIGINT NOT NULL,
      sort_order INT NOT NULL,
      is_orphan BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ,

      CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_product_images_image
        FOREIGN KEY (image_id)
        REFERENCES images_metadata(id)
        ON DELETE RESTRICT,

      CONSTRAINT uq_product_image_order
        UNIQUE (product_id, sort_order)
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_images`);
}
