import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_option_values (
      id BIGSERIAL PRIMARY KEY,
      variant_id BIGINT NOT NULL,
      dimension_id BIGINT NOT NULL,
      value_id BIGINT NOT NULL,

    CONSTRAINT fk_pvov_variant
      FOREIGN KEY (variant_id)
      REFERENCES product_variants(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_pvov_dimension
      FOREIGN KEY (dimension_id)
      REFERENCES product_variant_dimensions(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_pvov_value
      FOREIGN KEY (value_id)
      REFERENCES product_variant_dimension_values(id)
      ON DELETE CASCADE
  );  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variant_option_values`);
}
