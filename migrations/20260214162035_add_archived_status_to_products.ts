import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_products_status
  `);

  await knex.raw(`
    ALTER TABLE products
    ADD CONSTRAINT chk_products_status
    CHECK (status = ANY (ARRAY['ACTIVE', 'INACTIVE', 'ARCHIVED']))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_products_status
  `);

  await knex.raw(`
    ALTER TABLE products
    ADD CONSTRAINT chk_products_status
    CHECK (status = ANY (ARRAY['ACTIVE', 'INACTIVE']))
  `);
}
