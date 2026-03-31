import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user_addresses
    DROP COLUMN IF EXISTS subdistrict_name;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user_addresses
    ADD COLUMN subdistrict_name varchar(120) NULL;
  `);
}
