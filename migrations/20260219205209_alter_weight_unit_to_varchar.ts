import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    ALTER COLUMN weight_unit TYPE varchar(10),
    ALTER COLUMN weight_unit SET DEFAULT 'g',
    ALTER COLUMN weight_unit SET NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    ALTER COLUMN weight_unit TYPE char(3),
    ALTER COLUMN weight_unit SET DEFAULT 'g',
    ALTER COLUMN weight_unit SET NOT NULL;
  `);
}
