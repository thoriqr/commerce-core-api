import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD COLUMN id_path TEXT;
  `);

  await knex.raw(`
    WITH RECURSIVE category_tree AS (
      SELECT
        id,
        parent_id,
        id::text AS id_path
      FROM categories
      WHERE parent_id IS NULL

      UNION ALL

      SELECT
        c.id,
        c.parent_id,
        (ct.id_path || '/' || c.id::text) AS id_path
      FROM categories c
      JOIN category_tree ct ON c.parent_id = ct.id
    )
    UPDATE categories AS target
    SET id_path = ct.id_path
    FROM category_tree ct
    WHERE target.id = ct.id;
  `);

  await knex.raw(`
    ALTER TABLE categories
    ALTER COLUMN id_path SET NOT NULL;
  `);

  await knex.raw(`
    CREATE INDEX idx_categories_id_path ON categories (id_path);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    DROP COLUMN id_path;
  `);
}
