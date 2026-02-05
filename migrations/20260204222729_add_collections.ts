import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE collections (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NULL,
      sort_order INT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ,
      CONSTRAINT uq_collections_slug UNIQUE (slug)
    )  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS collections`);
}
