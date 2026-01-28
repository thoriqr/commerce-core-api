import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id)
    REFERENCES categories(id)
    ON DELETE RESTRICT
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE categories
    DROP CONSTRAINT fk_categories_parent
  `);
}
