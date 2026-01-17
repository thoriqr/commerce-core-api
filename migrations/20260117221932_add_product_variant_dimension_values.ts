import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE product_variant_dimension_values(
      id BIGSERIAL PRIMARY KEY,
      dimension_id BIGINT NOT NULL,
      value TEXT NOT NULL,
      normalized_value TEXT NOT NULL,
      display_value TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_dimension_values_dimension
      FOREIGN KEY (dimension_id)
      REFERENCES product_variant_dimensions(id)
      ON DELETE CASCADE
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS product_variant_dimension_values`);
}
