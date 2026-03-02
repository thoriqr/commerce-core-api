import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_pending_email;
    DROP INDEX IF EXISTS idx_pending_user_id;

    CREATE INDEX idx_pending_email_type_unused
    ON pending_verifications (email, type)
    WHERE used_at IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_pending_email_type_unused;

    CREATE INDEX idx_pending_email
    ON pending_verifications (email);

    CREATE INDEX idx_pending_user_id
    ON pending_verifications (user_id);
  `);
}
