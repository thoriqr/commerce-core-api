import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE collections
    ADD COLUMN status text;

    UPDATE collections
    SET status = 'ACTIVE';

    ALTER TABLE collections
    ALTER COLUMN status SET NOT NULL;

    ALTER TABLE collections
    ADD CONSTRAINT chk_collections_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'));

    ALTER TABLE collections
    DROP COLUMN is_active;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE collections
    ADD COLUMN is_active bool NOT NULL DEFAULT true;

    ALTER TABLE collections
    DROP CONSTRAINT IF EXISTS chk_collections_status;

    ALTER TABLE collections
    DROP COLUMN status;
  `);
}
