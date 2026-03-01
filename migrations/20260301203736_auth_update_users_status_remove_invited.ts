import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop old constraint
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT chk_users_status;
  `);

  // Add new constraint without INVITED
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_users_status
    CHECK (status IN ('ACTIVE', 'SUSPENDED'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop updated constraint
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT chk_users_status;
  `);

  // Restore old constraint
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_users_status
    CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED'));
  `);
}
