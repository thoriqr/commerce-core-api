import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_session_items
    ADD COLUMN product_id bigint NOT NULL,
    ADD COLUMN slug varchar(255) NOT NULL,
    ADD COLUMN option_snapshot jsonb NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE checkout_session_items
    DROP COLUMN IF EXISTS option_snapshot,
    DROP COLUMN IF EXISTS slug,
    DROP COLUMN IF EXISTS product_id;
  `);
}
