import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP CONSTRAINT IF EXISTS checkout_sessions_address_fkey;

    ALTER TABLE checkout_sessions
    ADD CONSTRAINT checkout_sessions_address_fkey
    FOREIGN KEY (address_id)
    REFERENCES user_addresses(id)
    ON DELETE SET NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_sessions
    DROP CONSTRAINT IF EXISTS checkout_sessions_address_fkey;

    ALTER TABLE checkout_sessions
    ADD CONSTRAINT checkout_sessions_address_fkey
    FOREIGN KEY (address_id)
    REFERENCES user_addresses(id)
    ON DELETE RESTRICT;
  `);
}
