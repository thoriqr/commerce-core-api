import { Knex } from "knex";
import { CreateProductSchema } from "./product.schema";
import { AppError } from "../../../errors/app-error";
import { ProductDetailRow, VariantDetailRow, VariantOptionRow } from "./product.types";
import { mapProductDetail } from "./product.mapper";
import { db } from "../../../infra/db/knex";

export class ProductRepo {
  create = async (trx: Knex.Transaction, input: CreateProductSchema, isVariant: boolean) => {
    const { name, slug, description, status, variants } = input;
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      INSERT INTO products (name, slug, description, is_variant, status)
      VALUES(:name, :slug, :description, :is_variant, :status)
      RETURNING id
    `,
      { name, slug, description, is_variant: isVariant, status }
    );

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to insert product");
    }

    const productId = row.id;

    for (const v of variants) {
      const { rows: variantRows } = await trx.raw<{ rows: { id: number }[] }>(
        `
        INSERT INTO product_variants (product_id, price, stock, weight, sku, is_primary)
        VALUES (:product_id, :price, :stock, :weight, :sku, :is_primary)
        RETURNING id
      `,
        { product_id: productId, price: v.price, stock: v.stock, weight: v.weight, sku: v.sku ?? null, is_primary: v.isPrimary }
      );

      const variantRow = variantRows[0];
      if (!variantRow) {
        throw new Error("Failed to insert product variant");
      }

      const variantId = variantRow.id;
      if (v.options?.length) {
        for (const opt of v.options) {
          await trx.raw(
            `
            INSERT INTO product_variant_options (product_variant_id, name, value)
            VALUES (:variant_id, :name, :value)
          `,
            {
              variant_id: variantId,
              name: opt.name,
              value: opt.value
            }
          );
        }
      }
    }
  };

  getById = async (id: number) => {
    const { rows: productRows } = await db.raw<{ rows: ProductDetailRow[] }>(
      `
      SELECT id, name, slug, description, is_variant, status
      FROM products
      WHERE id = :id
    `,
      { id: id }
    );

    const product = productRows[0];
    if (!product) {
      throw AppError.notFound("Product not found");
    }

    const { rows: variantRows } = await db.raw<{ rows: VariantDetailRow[] }>(
      `
      SELECT id, product_id, price, stock, weight, sku, is_primary
      FROM product_variants
      WHERE product_id = :id
      ORDER BY is_primary, id ASC
    `,
      { id }
    );

    if (variantRows.length === 0) {
      throw AppError.internal("Invariant broken: product has no variants");
    }

    const variantIds = variantRows.map((v) => v.id);

    const { rows: optionRows } = await db.raw<{ rows: VariantOptionRow[] }>(
      `
      SELECT id, product_variant_id, name, value
      FROM product_variant_options
      WHERE product_variant_id = ANY(:variant_ids)
    `,
      { variant_ids: variantIds }
    );

    return mapProductDetail(product, variantRows, optionRows);
  };
}
