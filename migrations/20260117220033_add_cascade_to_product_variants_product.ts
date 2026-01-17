import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    DROP CONSTRAINT fk_product_variants_product;

    ALTER TABLE product_variants
    ADD CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE product_variants
    DROP CONSTRAINT fk_product_variants_product;

    ALTER TABLE product_variants
    ADD CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id)
    REFERENCES products(id);
  `);
}
