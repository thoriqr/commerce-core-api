import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    ADD CONSTRAINT chk_products_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    DROP CONSTRAINT chk_products_status
  `);
}
