import { Knex } from "knex";
import { ProductQueryParamsSchema, ProductUpsertSchema, VariantDimensionSchema, VariantSchema } from "./product.schema";
import { AppError } from "../../../errors/app-error";
import {
  IdMap,
  ProductDetailRow,
  ProductListRow,
  ProductRow,
  VariantDimensionRow,
  VariantDimensionValueRow,
  VariantImagesMap,
  VariantOptionValueRow,
  VariantRow
} from "./product.types";
import { mapProductDetail, mapProductList } from "./product.mapper";
import { db } from "../../../infra/db/knex";
import { displayName, displayValue, normalizeName, normalizeSku, normalizeValue } from "./product.normalizer";

export class ProductRepo {
  getAll = async (qParams: ProductQueryParamsSchema) => {
    const { page, limit, sortBy, sortDir } = qParams;

    const { where, having, bindings } = this.buildProductFilter(qParams);

    const SORT_MAP: Record<string, string> = {
      created_at: "p.created_at",
      name: "p.name",
      price: "min_price",
      stock: "total_stock"
    };

    const sortColumn = SORT_MAP[sortBy] ?? SORT_MAP.created_at;
    const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

    const offset = (page - 1) * limit;
    bindings.push(limit, offset);

    const sql = `
      SELECT
        p.id, 
        p.name,
        p.slug,
        p.is_variant,
        p.status,
        p.created_at,
        COALESCE(SUM(pv.stock), 0) AS total_stock,
        COUNT(pv.id) AS variant_count,
        MIN(pv.price) AS min_price,
        MAX(pv.price) AS max_price,
        COALESCE(
          MAX(CASE WHEN pv.is_primary THEN pv.sku END),
          MIN(pv.sku)
        ) AS representative_sku
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY p.id
      ${having.length ? `HAVING ${having.join(" AND ")}` : ""}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const { rows } = await db.raw<{ rows: ProductListRow[] }>(sql, bindings);

    return mapProductList(rows);
  };

  getCount = async (qParams: ProductQueryParamsSchema) => {
    const { where, having, bindings } = this.buildProductFilter(qParams);

    const sql = `
      SELECT COUNT(*)::int AS total FROM (
        SELECT p.id
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY p.id
        ${having.length ? `HAVING ${having.join(" AND ")}` : ""}
      ) t
    `;

    const { rows } = await db.raw<{ rows: { total: number }[] }>(sql, bindings);

    const row = rows[0];
    if (!row) {
      throw AppError.internal("Cannot get total products");
    }

    return row.total;
  };

  getDetailById = async (id: number) => {
    const { rows: productRows } = await db.raw<{ rows: ProductDetailRow[] }>(
      `
      SELECT id, name, description, is_variant, status
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

  create = async (trx: Knex.Transaction, input: ProductUpsertSchema, isVariant: boolean, slug: string, variantImagesMap: VariantImagesMap) => {
    const { name, description, status, variants, variantDimension } = input;

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

    // guard for single product
    if (variantImagesMap.size > 0 && variants.length === 1) {
      throw AppError.internal("Variant images provided for single variant product");
    }

    // SINGLE PRODUCT
    if (variants.length === 1) {
      await this.insertVariants(trx, productId, variants);
      return;
    }

    // MULTI VARIANT
    const dimensionIdMap = await this.insertVariantDimensions(trx, productId, variantDimension);
    const valueIdMap = await this.insertVariantDimensionValues(trx, variantDimension, dimensionIdMap);

    await this.insertVariantImages(trx, productId, variantDimension, variantImagesMap);

    const variantIdMap = await this.insertVariants(trx, productId, variants);

    await this.insertVariantOptionValues(trx, variants, variantIdMap, dimensionIdMap, valueIdMap);
  };

  update = async (trx: Knex.Transaction, id: number, input: ProductUpsertSchema, isVariant: boolean, slug: string) => {
    const { name, description, status, variants, variantDimension } = input;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      UPDATE products
        SET name = :name, description = :description, status = :status, is_variant = :is_variant, slug = :slug, updated_at = now()
      WHERE id = :id
      RETURNING id
    `,
      { name, description, status, is_variant: isVariant, slug, id }
    );

    const row = rows[0];
    if (!row) {
      throw new Error("Update failed: product not found");
    }

    const productId = row.id;
    await trx.raw(`DELETE FROM product_variants WHERE product_id = :productId`, { productId });
    await trx.raw(`DELETE FROM product_variant_dimensions WHERE product_id = :productId`, { productId });

    // SINGLE PRODUCT
    if (variants.length === 1) {
      await this.insertVariants(trx, productId, variants);
      return;
    }

    // MULTI VARIANT
    const dimensionIdMap = await this.insertVariantDimensions(trx, productId, variantDimension);
    const valueIdMap = await this.insertVariantDimensionValues(trx, variantDimension, dimensionIdMap);
    const variantIdMap = await this.insertVariants(trx, productId, variants);
    await this.insertVariantOptionValues(trx, variants, variantIdMap, dimensionIdMap, valueIdMap);
  };

  findBaseById = async (id: number, trx?: Knex.Transaction) => {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{ rows: ProductRow[] }>(
      `
      SELECT * FROM products
      WHERE id = :id 
    `,
      { id }
    );

    const product = rows[0];
    if (!product) {
      throw AppError.notFound("Product not found");
    }

    return product;
  };

  private insertVariantImages = async (
    trx: Knex.Transaction,
    productId: number,
    variantDimensions: VariantDimensionSchema[],
    variantImagesMap: VariantImagesMap
  ) => {
    for (const dim of variantDimensions) {
      for (const opt of dim.options) {
        const img = variantImagesMap.get(opt.id);
        if (!img) continue;

        // 1. insert images_metadata
        const { rows } = await trx.raw<{ rows: { id: number }[] }>(
          `
          INSERT INTO images_metadata
            (image_key, original_file_name, mime_type, file_size, width, height, original_available)
          VALUES (:image_key, :original_file_name, :mime_type, :file_size, :width, :height, false)
          RETURNING id
        `,
          {
            image_key: img.imageKey,
            original_file_name: img?.originalFileName,
            mime_type: img?.mimeType,
            file_size: img?.size,
            width: img?.width,
            height: img?.height
          }
        );

        const row = rows[0];

        if (!row) {
          throw AppError.badRequest("Failed to insert images metadata");
        }

        const imgMetadataId = row.id;

        // 2. insert product_variant_images
        const { rows: imgRows } = await trx.raw<{ rows: { id: number }[] }>(
          `
          INSERT INTO product_variant_images
            (product_id, image_id, is_orphan)
          VALUES
            (:product_id, :image_id, false)
          RETURNING id
        `,
          {
            product_id: productId,
            image_id: imgMetadataId
          }
        );

        const imgRow = imgRows[0];

        if (!imgRow) {
          throw AppError.badRequest("Failed to insert variant images");
        }

        const variantImageId = imgRow.id;

        // 3. insert signature

        await trx.raw(
          `
          INSERT INTO product_variant_image_signatures
            (variant_image_id, dimension_key, value_key)
          VALUES
             (:variant_image_id, :dimension_key, :value_key)
        `,
          {
            variant_image_id: variantImageId,
            dimension_key: normalizeName(dim.name),
            value_key: normalizeValue(opt.value)
          }
        );
      }
    }
  };

  private buildProductFilter(qParams: ProductQueryParamsSchema) {
    const { q, isVariant, status, stock, priceMin, priceMax } = qParams;

    const where: string[] = [];
    const having: string[] = [];
    const bindings: any[] = [];

    // WHERE
    if (status) {
      where.push(`p.status = ?`);
      bindings.push(status);
    }

    if (typeof isVariant === "boolean") {
      where.push(`p.is_variant = ?`);
      bindings.push(isVariant);
    }

    if (q) {
      where.push(`
      (
        p.name ILIKE ?
        OR p.slug ILIKE ?
        OR pv.sku ILIKE ?
      )
    `);
      bindings.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    // HAVING
    if (stock === "IN_STOCK") {
      having.push(`SUM(pv.stock) > 0`);
    }

    if (stock === "OUT_OF_STOCK") {
      having.push(`SUM(pv.stock) = 0`);
    }

    if (stock === "LOW_STOCK") {
      having.push(`SUM(pv.stock) < ?`);
      bindings.push(5);
    }

    if (priceMin != null) {
      having.push(`MIN(pv.price) >= ?`);
      bindings.push(priceMin);
    }

    if (priceMax != null) {
      having.push(`MAX(pv.price) <= ?`);
      bindings.push(priceMax);
    }

    return { where, having, bindings };
  }

  private insertVariantDimensions = async (trx: Knex.Transaction, productId: number, variantDims: VariantDimensionSchema[]) => {
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

  private insertVariantDimensionValues = async (trx: Knex.Transaction, variantDims: VariantDimensionSchema[], dimensionIdMap: IdMap) => {
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

  private insertVariants = async (trx: Knex.Transaction, productId: number, variants: VariantSchema[]) => {
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
          sku: normalizeSku(variant.sku),
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
    variants: VariantSchema[],
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
}
