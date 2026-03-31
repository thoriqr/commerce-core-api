import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    ADD COLUMN recipient_name varchar(120) NOT NULL,
    ADD COLUMN phone varchar(30) NOT NULL,
    ADD COLUMN address_line text NOT NULL,
    ADD COLUMN province_name varchar(120) NOT NULL,
    ADD COLUMN city_name varchar(120) NOT NULL,
    ADD COLUMN district_name varchar(120) NOT NULL,
    ADD COLUMN postal_code varchar(20);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP COLUMN IF EXISTS recipient_name,
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS address_line,
    DROP COLUMN IF EXISTS province_name,
    DROP COLUMN IF EXISTS city_name,
    DROP COLUMN IF EXISTS district_name,
    DROP COLUMN IF EXISTS postal_code;
  `);
}
