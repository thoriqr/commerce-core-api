import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE variant_dimensions_presets(
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL
    )  
  `);

  await knex.raw(`
    CREATE TABLE variant_dimension_values_presets(
      id BIGSERIAL PRIMARY KEY,
      dimension_preset_id BIGINT NOT NULL,
      name TEXT NOT NULL,
      hex_color text NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL,
        CONSTRAINT fk_variant_dimension_values_presets_dimension
        FOREIGN KEY (dimension_preset_id)
        REFERENCES variant_dimensions_presets(id)
        ON DELETE CASCADE
    )  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS variant_dimension_values_presets;
  `);

  await knex.raw(`
    DROP TABLE IF EXISTS variant_dimensions_presets;
  `);
}
