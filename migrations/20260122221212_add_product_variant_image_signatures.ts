import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_image_signatures (
      id BIGSERIAL PRIMARY KEY,
      variant_image_id BIGINT NOT NULL,
      dimension_key text NOT NULL,
      value_key text NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ,

      CONSTRAINT fk_variant_image_signature_variant_image
        FOREIGN KEY (variant_image_id)
        REFERENCES product_variant_images(id)
        ON DELETE CASCADE,

      CONSTRAINT uq_image_dimension UNIQUE (variant_image_id, dimension_key)
  );
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variant_image_signatures`);
}
