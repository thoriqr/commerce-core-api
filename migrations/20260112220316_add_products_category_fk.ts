import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
   ALTER TABLE products
   ADD CONSTRAINT fk_products_category
   FOREIGN KEY (category_id)
   REFERENCES categories(id) 
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE products
    DROP CONSTRAINT fk_products_category  
  `);
}
