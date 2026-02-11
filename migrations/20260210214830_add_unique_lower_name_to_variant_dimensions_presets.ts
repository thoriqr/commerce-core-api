import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE UNIQUE INDEX uq_variant_dimensions_presets_name_lower
    ON variant_dimensions_presets (LOWER(name));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS uq_variant_dimensions_presets_name_lower;
  `);
}
