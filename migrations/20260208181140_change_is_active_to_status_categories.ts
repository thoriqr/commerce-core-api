import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD COLUMN status text;

    UPDATE categories
    SET status = 'ACTIVE';

    ALTER TABLE categories
    ALTER COLUMN status SET NOT NULL;

    ALTER TABLE categories
    ADD CONSTRAINT chk_categories_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'));

    ALTER TABLE categories
    DROP COLUMN is_active;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD COLUMN is_active bool NOT NULL DEFAULT true;

    ALTER TABLE categories
    DROP CONSTRAINT IF EXISTS chk_categories_status;

    ALTER TABLE categories
    DROP COLUMN status;
  `);
}
