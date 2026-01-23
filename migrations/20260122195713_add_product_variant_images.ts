import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_images(
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL,
      image_id BIGINT NOT NULL,
      is_orphan BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ,

      CONSTRAINT fk_variant_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,
      
      CONSTRAINT fk_variant_images_image
        FOREIGN KEY (image_id)
        REFERENCES images_metadata(id)
        ON DELETE RESTRICT
    ) 
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variant_images`);
}
