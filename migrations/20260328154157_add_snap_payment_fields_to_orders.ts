import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.orders
    ADD COLUMN snap_token TEXT NULL,
    ADD COLUMN snap_redirect_url TEXT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.orders
    DROP COLUMN IF EXISTS snap_token,
    DROP COLUMN IF EXISTS snap_redirect_url;
  `);
}
