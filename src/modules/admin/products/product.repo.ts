import { Knex } from "knex";
import { CreateProductSchema, VariantDimsSchema, VariantSchema } from "./product.schema";
import { AppError } from "../../../errors/app-error";
import { IdMap, ProductDetailRow, VariantDimensionRow, VariantDimensionValueRow, VariantOptionValueRow, VariantRow } from "./product.types";
import { mapProductDetail } from "./product.mapper";
import { db } from "../../../infra/db/knex";
import { displayName, displayValue, normalizeName, normalizeValue } from "./product.normalizer";

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
    const variantDims = input.variantDimension;

    // SINGLE PRODUCT
    if (variants.length === 1) {
      await this.insertVariants(trx, productId, variants);
    }

    // MULTI VARIANT
    const dimensionIdMap = await this.insertVariantDimensions(trx, productId, variantDims);
    const valueIdMap = await this.insertVariantDimensionValues(trx, variantDims, dimensionIdMap);
    const variantIdMap = await this.insertVariants(trx, productId, variants);
    await this.insertVariantOptionValues(trx, variants, variantIdMap, dimensionIdMap, valueIdMap);
  };

  private insertVariantDimensions = async (trx: Knex.Transaction, productId: number, variantDims: VariantDimsSchema) => {
    const map = new Map<string, number>();

    for (const dim of variantDims) {
      const { rows } = await trx.raw<{ rows: { id: number }[] }>(
        `
        INSERT INTO product_variant_dimensions (product_id, name, normalized_name, display_name)
        VALUES (:product_id, :name, :normalized_name, :display_name)
        RETURNING id
      `,
        { product_id: productId, name: dim.name, normalized_name: normalizeName(dim.name), display_name: displayName(dim.name) }
      );

      if (!rows[0]) {
        throw new Error("Failed to insert product_variant_dimensions");
      }

      map.set(String(dim.id), rows[0].id);
    }

    return map;
  };

  private insertVariantDimensionValues = async (trx: Knex.Transaction, variantDims: VariantDimsSchema, dimensionIdMap: IdMap) => {
    const map = new Map<string, number>();

    for (const dim of variantDims) {
      const dbDimensionId = dimensionIdMap.get(String(dim.id));

      if (!dbDimensionId) {
        throw AppError.internal(`Unknown variant dimension id: ${dim.id}`);
      }

      for (const opt of dim.options) {
        const { rows } = await trx.raw<{ rows: { id: number }[] }>(
          `
          INSERT INTO product_variant_dimension_values
            (dimension_id, value, normalized_value, display_value)
          VALUES
            (:dimension_id, :value, :normalized_value, :display_value)
          RETURNING id
        `,
          {
            dimension_id: dbDimensionId,
            value: opt.value,
            normalized_value: normalizeValue(opt.value),
            display_value: displayValue(opt.value)
          }
        );

        if (!rows[0]) {
          throw AppError.badRequest("Failed to insert product_variant_dimension_values");
        }

        // FE optionId → DB valueId
        map.set(String(opt.id), rows[0].id);
      }
    }

    return map;
  };

  private insertVariants = async (trx: Knex.Transaction, productId: number, variants: VariantSchema) => {
    const map = new Map<string, number>();

    for (const variant of variants) {
      const { rows } = await trx.raw<{ rows: { id: number }[] }>(
        `
        INSERT INTO product_variants
          (product_id, price, stock, weight, sku, is_primary)
        VALUES
          (:product_id, :price, :stock, :weight, :sku, :is_primary)
        RETURNING id
      `,
        {
          product_id: productId,
          price: variant.price,
          stock: variant.stock,
          weight: variant.weight,
          sku: variant.sku ?? null,
          is_primary: variant.isPrimary
        }
      );

      if (!rows[0]) {
        throw AppError.badRequest("Failed to insert product_variants");
      }

      map.set(String(variant.id), rows[0].id);
    }

    return map;
  };

  private insertVariantOptionValues = async (
    trx: Knex.Transaction,
    variants: VariantSchema,
    variantIdMap: IdMap,
    dimensionIdMap: IdMap,
    valueIdMap: IdMap
  ) => {
    for (const variant of variants) {
      const dbVariantId = variantIdMap.get(String(variant.id));
      if (!dbVariantId) {
        throw AppError.internal(`Unknown variant id: ${variant.id}`);
      }

      for (const opt of variant.options) {
        const dbDimensionId = dimensionIdMap.get(String(opt.dimensionId));

        if (!dbDimensionId) {
          throw AppError.internal(`Unknown variant dimension id: ${opt.dimensionId}`);
        }

        const dbValueId = valueIdMap.get(String(opt.optionId));

        if (!dbValueId) {
          throw AppError.internal(`Unknown variant option id: ${opt.optionId}`);
        }

        await trx.raw(
          `
          INSERT INTO product_variant_option_values (variant_id, dimension_id, value_id)
          VALUES (:variant_id, :dimension_id, :value_id)
        `,
          { variant_id: dbVariantId, dimension_id: dbDimensionId, value_id: dbValueId }
        );
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
      { id }
    );

    const product = productRows[0];
    if (!product) {
      throw AppError.notFound("Product not found");
    }

    const { rows: variantRows } = await db.raw<{ rows: VariantRow[] }>(
      `
      SELECT id, product_id, price, stock, weight, sku, is_primary
      FROM product_variants
      WHERE product_id = :id
    `,
      { id }
    );

    const variantIds = variantRows.map((v) => v.id);

    const { rows: dimensionRows } = await db.raw<{ rows: VariantDimensionRow[] }>(
      `
      SELECT id, product_id, name, normalized_name, display_name
      FROM product_variant_dimensions
      WHERE product_id = :id
    `,
      { id }
    );

    const dimensionIds = dimensionRows.map((d) => d.id);

    const { rows: dimensionValueRows } = await db.raw<{ rows: VariantDimensionValueRow[] }>(
      `
      SELECT id, dimension_id, value, normalized_value, display_value
      FROM product_variant_dimension_values
      WHERE dimension_id = ANY(:dimensionIds)
    `,
      { dimensionIds }
    );

    const { rows: optionValueRows } = await db.raw<{ rows: VariantOptionValueRow[] }>(
      `
      SELECT id, variant_id, dimension_id, value_id
      FROM product_variant_option_values
      WHERE variant_id = ANY(:variantIds)
    `,
      { variantIds }
    );

    return mapProductDetail(product, variantRows, dimensionRows, dimensionValueRows, optionValueRows);
  };
}
