import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // add column first (nullable)
  await knex.raw(`
    ALTER TABLE categories
    ADD COLUMN slug_path TEXT;
  `);

  // backfill slug_path based id_path
  await knex.raw(`
    UPDATE categories parent
    SET slug_path = sub.slug_path
    FROM (
      SELECT 
        c_parent.id,
        string_agg(c.slug, '/' ORDER BY array_position(string_to_array(c_parent.id_path, '/'), c.id::text)) AS slug_path
      FROM categories c_parent
      JOIN categories c 
        ON c.id::text = ANY(string_to_array(c_parent.id_path, '/'))
      GROUP BY c_parent.id, c_parent.id_path
    ) sub
    WHERE parent.id = sub.id;
  `);

  // set NOT NULL
  await knex.raw(`
    ALTER TABLE categories
    ALTER COLUMN slug_path SET NOT NULL;
  `);

  // unique index
  await knex.raw(`
    CREATE UNIQUE INDEX uq_categories_slug_path
    ON categories (slug_path);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS uq_categories_slug_path;
  `);

  await knex.raw(`
    ALTER TABLE categories
    DROP COLUMN IF EXISTS slug_path;
  `);
}
