import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ALTER COLUMN recipient_name DROP NOT NULL,
    ALTER COLUMN phone DROP NOT NULL,
    ALTER COLUMN address_line DROP NOT NULL,
    ALTER COLUMN province_name DROP NOT NULL,
    ALTER COLUMN city_name DROP NOT NULL,
    ALTER COLUMN district_name DROP NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ALTER COLUMN recipient_name SET NOT NULL,
    ALTER COLUMN phone SET NOT NULL,
    ALTER COLUMN address_line SET NOT NULL,
    ALTER COLUMN province_name SET NOT NULL,
    ALTER COLUMN city_name SET NOT NULL,
    ALTER COLUMN district_name SET NOT NULL;
  `);
}
