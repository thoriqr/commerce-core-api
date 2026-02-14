import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { displayName, displayValue, normalizeName, normalizeSku, normalizeValue } from "./product.normalizer";
import {
  ProductImageSchema,
  ProductQueryParamsSchema,
  ProductUpsertSchema,
  UpdateProductStatusSchema,
  VariantDimensionSchema,
  VariantSchema
} from "./product.schema";
import {
  IdMap,
  ProductDetailRow,
  ProductListRow,
  ProductRow,
  VariantDimensionRow,
  VariantDimensionValueRow,
  VariantImageRow,
  VariantImageFilesMap,
  VariantOptionValueRow,
  VariantRow,
  ProductImageFilesMap,
  ProductCollectionIdRow
} from "./product.types";
import { mapProductDetail, mapProductList } from "./product.mapper";
import { PRODUCT_LIMITS } from "./product.constants";
import { IMAGE_CONTEXT } from "@/constants/image-context";
import { ProductVariantRepo } from "./product-variant.repo";

export class ProductRepo {
  constructor(private readonly variantRepo: ProductVariantRepo) {}

  async getAll(qParams: ProductQueryParamsSchema) {
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
        img.image_key AS thumbnail_image,
        p.is_variant,
        p.status,
        c.name AS category_name,
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
      JOIN product_variants pv
        ON pv.product_id = p.id
      AND pv.status = 'ACTIVE'

      -- get one product_images
      LEFT JOIN LATERAL(
        SELECT im.image_key
        FROM product_images pi
        JOIN images_metadata im ON im.id = pi.image_id
        WHERE pi.product_id = p.id
          AND pi.is_orphan = false
        ORDER BY pi.sort_order ASC, pi.id ASC
        LIMIT 1
      ) img ON true

      LEFT JOIN categories c ON c.id = p.category_id

      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY
        p.id,
        img.image_key,
        c.name
      ${having.length ? `HAVING ${having.join(" AND ")}` : ""}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const { rows } = await db.raw<{ rows: ProductListRow[] }>(sql, bindings);

    return mapProductList(rows);
  }

  async getCount(qParams: ProductQueryParamsSchema) {
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
  }

  async getDetailById(productId: number) {
    const { rows: productRows } = await db.raw<{ rows: ProductDetailRow[] }>(
      `
      SELECT id, name, description, is_variant, status, category_id
      FROM products
      WHERE id = :productId
    `,
      { productId }
    );

    const product = productRows[0];
    if (!product) {
      throw AppError.notFound("Product not found");
    }

    const { rows: colIdRows } = await db.raw<{
      rows: ProductCollectionIdRow[];
    }>(
      `
      SELECT collection_id
      FROM product_collections
      WHERE product_id = :productId
      `,
      { productId }
    );

    const { rows: imgRows } = await db.raw(
      `
      SELECT pi.id, pi.sort_order, im.image_key
      FROM product_images pi
      JOIN images_metadata im ON im.id = pi.image_id
      WHERE pi.product_id = :productId
        AND pi.is_orphan = false
    `,
      { productId }
    );

    const { rows: variantRows } = await db.raw<{ rows: VariantRow[] }>(
      `
      SELECT id, product_id, price, stock, weight, sku, is_primary
      FROM product_variants
      WHERE product_id = :productId
        AND status <> 'ARCHIVED'
    `,
      { productId }
    );

    const variantIds = variantRows.map((v) => v.id);

    const { rows: dimensionRows } = await db.raw<{ rows: VariantDimensionRow[] }>(
      `
      SELECT id, product_id, name, normalized_name, display_name
      FROM product_variant_dimensions
      WHERE product_id = :productId
    `,
      { productId }
    );

    const dimensionIds = dimensionRows.map((d) => d.id);

    const { rows: dimensionValueRows } = await db.raw<{ rows: VariantDimensionValueRow[] }>(
      `
      SELECT id, dimension_id, value, normalized_value, display_value, hex_color
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

    const { rows: variantImageRows } = await db.raw<{ rows: VariantImageRow[] }>(
      `
      SELECT
        pvi.id,
        pvis.dimension_key,
        pvis.value_key,
        im.image_key

        FROM product_variant_images pvi

        JOIN product_variant_image_signatures pvis ON pvis.variant_image_id = pvi.id
        JOIN images_metadata im ON im.id = pvi.image_id
        WHERE pvi.product_id = :productId
          AND pvi.is_orphan = false
    `,
      { productId }
    );

    return mapProductDetail(product, colIdRows, imgRows, variantRows, dimensionRows, dimensionValueRows, optionValueRows, variantImageRows);
  }

  async create(
    trx: Knex.Transaction,
    input: ProductUpsertSchema,
    isVariant: boolean,
    slug: string,
    productImageFilesMap: ProductImageFilesMap,
    variantImageFilesMap: VariantImageFilesMap
  ) {
    const { name, description, status, images, variants, variantDimension, categoryId, collectionIds } = input;

    await this.validateCategoryId(trx, categoryId);

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      INSERT INTO products (name, slug, description, is_variant, status, category_id)
      VALUES(:name, :slug, :description, :is_variant, :status, :categoryId)
      RETURNING id
    `,
      { name, slug, description, is_variant: isVariant, status, categoryId }
    );

    const row = rows[0];
    if (!row) {
      logger.error("Insert products returned no rows");
      throw AppError.internal();
    }

    const productId = row.id;

    if (collectionIds.length > 0) {
      await this.insertProductCollections(trx, productId, collectionIds);
    }

    await this.insertProductImages(trx, productId, images, productImageFilesMap);

    // 4️⃣ Guard
    if (variantImageFilesMap.size > 0 && variants.length === 1) {
      throw AppError.internal("Variant images are only allowed for multi-variant products");
    }

    const hasVariantDimension = Array.isArray(variantDimension) && variantDimension.length > 0;

    // 5️⃣ Snapshot lookup
    const snapshotLookup = hasVariantDimension ? this.buildVariantSnapshotLookup(variantDimension) : null;

    // 6️⃣ Insert variants (NEW ONLY)
    const variantIdMap = await this.variantRepo.insertNewVariants(trx, productId, variants, snapshotLookup);

    // 7️⃣ Descriptor runtime only if multi
    if (hasVariantDimension) {
      await this.variantRepo.handleNewAndRemovedVariantImages(trx, productId, variantDimension, variantImageFilesMap, new Set());

      await this.variantRepo.rebuildDimensionsAndPivot(trx, productId, variantDimension, variants, variantIdMap);
    }
  }

  async update(
    trx: Knex.Transaction,
    id: number,
    input: ProductUpsertSchema,
    isVariant: boolean,
    slug: string,
    productImageFilesMap: ProductImageFilesMap,
    variantImageFilesMap: VariantImageFilesMap
  ) {
    const { name, description, status, images, variants, variantDimension, categoryId, collectionIds } = input;

    await this.validateCategoryId(trx, categoryId);

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      UPDATE products
        SET name = :name, description = :description, status = :status, category_id = :categoryId, is_variant = :is_variant, slug = :slug, updated_at = now()
      WHERE id = :id
      RETURNING id
    `,
      { name, description, status, categoryId, is_variant: isVariant, slug, id }
    );

    const row = rows[0];
    if (!row) {
      throw AppError.notFound("Product not found");
    }

    const productId = row.id;

    await trx.raw(
      `
      DELETE FROM product_collections
      WHERE product_id = :productId
    `,
      { productId }
    );

    if (collectionIds.length > 0) {
      await this.insertProductCollections(trx, productId, collectionIds);
    }

    await this.updateProductImages(trx, productId, images, productImageFilesMap);

    // multi variant image guard
    if (variantImageFilesMap.size > 0 && variants.length === 1) {
      throw AppError.internal("Variant images are only allowed for multi-variant products");
    }

    const payloadIds = new Set(variants.filter((v) => v.id).map((v) => Number(v.id)));

    await this.variantRepo.archiveMissingVariants(trx, productId, payloadIds);

    const dbVariantMap = await this.variantRepo.getVariantStatusMap(trx, productId);

    const existingVariants = variants.filter((v) => v.id);
    const newVariants = variants.filter((v) => !v.id);

    const hasVariantDimension = Array.isArray(variantDimension) && variantDimension.length > 0;
    const hadDimensionBefore = await this.variantRepo.productHadDimensions(trx, productId);

    const snapshotLookup = hasVariantDimension ? this.buildVariantSnapshotLookup(variantDimension) : null;

    const existingMap = await this.variantRepo.updateExistingVariants(trx, productId, existingVariants, dbVariantMap, snapshotLookup);

    const newMap = await this.variantRepo.insertNewVariants(trx, productId, newVariants, snapshotLookup);

    const variantIdMap = new Map([...existingMap, ...newMap]);

    const state = this.resolveDimensionState(hadDimensionBefore, hasVariantDimension);

    switch (state) {
      case "MULTI_TO_SINGLE":
        await this.variantRepo.clearAllVariantImages(trx, productId);
        await this.variantRepo.clearAllDimensionsAndPivot(trx, productId);
        break;

      case "SINGLE_TO_MULTI":
        await this.variantRepo.handleNewAndRemovedVariantImages(trx, productId, variantDimension, variantImageFilesMap, new Set());

        await this.variantRepo.rebuildDimensionsAndPivot(trx, productId, variantDimension, variants, variantIdMap);
        break;

      case "MULTI_TO_MULTI":
        const usedImageIds = await this.variantRepo.updateVariantImageSignatures(trx, productId, variantDimension);

        await this.variantRepo.handleNewAndRemovedVariantImages(trx, productId, variantDimension, variantImageFilesMap, usedImageIds);

        await this.variantRepo.rebuildDimensionsAndPivot(trx, productId, variantDimension, variants, variantIdMap);
        break;

      case "SINGLE_TO_SINGLE":
        // nothing
        break;
    }
  }

  buildVariantSnapshotLookup(variantDimension: VariantDimensionSchema[]) {
    const valueMap = new Map<string, { dimensionName: string; value: string }>();

    for (const dim of variantDimension) {
      for (const opt of dim.options) {
        valueMap.set(String(opt.id), {
          dimensionName: dim.name,
          value: opt.value
        });
      }
    }

    return valueMap;
  }

  private resolveDimensionState(had: boolean, has: boolean) {
    if (!had && !has) return "SINGLE_TO_SINGLE";
    if (!had && has) return "SINGLE_TO_MULTI";
    if (had && has) return "MULTI_TO_MULTI";
    return "MULTI_TO_SINGLE";
  }

  async validateCategoryId(trx: Knex.Transaction, categoryId: number) {
    const { rows: categoryRows } = await trx.raw(
      `
      SELECT 1
      FROM categories
      WHERE id = :categoryId
      LIMIT 1;
    `,
      { categoryId }
    );

    if (!categoryRows.length) {
      throw AppError.notFound("Category not found");
    }
  }

  async updateStatus(input: UpdateProductStatusSchema) {
    const { productIds, status } = input;

    const { rows } = await db.raw<{ rows: { id: number }[] }>(
      `
        SELECT id FROM products
        WHERE id = ANY(:productIds)
      `,
      { productIds }
    );

    if (rows.length !== productIds.length) {
      throw AppError.notFound("Some products not found");
    }

    await db.raw(
      `
        UPDATE products
          SET status = :status
        WHERE id = ANY(:productIds)
      `,
      { status, productIds }
    );
  }

  async remove(trx: Knex.Transaction, id: number) {
    const { rows: metaRows } = await trx.raw<{
      rows: { id: number; image_key: string }[];
    }>(
      `
    SELECT im.id, im.image_key
    FROM images_metadata im
    JOIN product_images pi ON pi.image_id = im.id
    WHERE pi.product_id = :id

    UNION

    SELECT im.id, im.image_key
    FROM images_metadata im
    JOIN product_variant_images pvi ON pvi.image_id = im.id
    WHERE pvi.product_id = :id
    `,
      { id }
    );

    const imageKeys = metaRows.map((r) => r.image_key);
    const imageIds = metaRows.map((r) => r.id);

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    DELETE FROM products
    WHERE id = :id
    RETURNING id
    `,
      { id }
    );

    if (rows.length === 0) {
      throw AppError.notFound("Product not found");
    }

    return { imageIds, imageKeys };
  }

  async findBaseById(id: number, trx?: Knex.Transaction) {
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
  }

  async removeImagesMetadata(ids: number[]) {
    if (ids.length === 0) return;

    await db.raw(
      `
    DELETE FROM images_metadata im
    WHERE im.id = ANY(:ids)
      AND NOT EXISTS (
        SELECT 1
        FROM product_variant_images pvi
        WHERE pvi.image_id = im.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM product_images pi
        WHERE pi.image_id = im.id
      )
    `,
      { ids }
    );
  }

  private async getExistingProductImages(trx: Knex.Transaction, productId: number): Promise<{ id: number; image_id: number }[]> {
    const { rows } = await trx.raw<{
      rows: { id: number; image_id: number }[];
    }>(
      `
    SELECT id, image_id
    FROM product_images
    WHERE product_id = :productId
      AND is_orphan = false
    `,
      { productId }
    );

    return rows;
  }

  private async insertProductImages(
    trx: Knex.Transaction,
    productId: number,
    images: ProductImageSchema[],
    productImageFilesMap: ProductImageFilesMap
  ) {
    for (const pImg of images) {
      const img = productImageFilesMap.get(pImg.sortOrder);

      if (!img) {
        throw AppError.badRequest("Invalid product image reference");
      }

      // 1. insert images_metadata
      const { rows } = await trx.raw<{ rows: { id: number }[] }>(
        `
          INSERT INTO images_metadata
            (image_key, original_file_name, mime_type, file_size, width, height, original_available, context)
          VALUES
            (:image_key, :original_file_name, :mime_type, :file_size, :width, :height, :original_available, :context)
          RETURNING id
        `,
        {
          image_key: img.imageKey,
          original_file_name: img?.originalFileName,
          mime_type: img?.mimeType,
          file_size: img?.size,
          width: img?.width,
          height: img?.height,
          original_available: img.originalAvailable,
          context: IMAGE_CONTEXT.PRODUCT
        }
      );

      const row = rows[0];

      if (!row) {
        logger.error("Insert images_metadata returned no rows");
        throw AppError.internal();
      }

      const imgMetadataId = row.id;

      await trx.raw(
        `
        INSERT INTO product_images (product_id, image_id, sort_order, is_orphan) 
        VALUES (:product_id, :image_id, :sort_order, false)
      `,
        { product_id: productId, image_id: imgMetadataId, sort_order: pImg.sortOrder }
      );
    }
  }

  private async updateProductImages(
    trx: Knex.Transaction,
    productId: number,
    images: ProductImageSchema[],
    productImageFilesMap: ProductImageFilesMap
  ) {
    const existingImages = await this.getExistingProductImages(trx, productId);
    const existingImageMap = new Map<number, number>(); // product_image_id → image_id

    existingImages.forEach((img) => {
      existingImageMap.set(img.id, img.image_id);
    });

    const usedProductImageIds = new Set<number>();
    let activeCount = 0;

    // temporary offset to avoid UNIQUE (product_id, sort_order) conflict during reorder
    // max images = 5, so +100 is safe

    await trx.raw(
      `
        UPDATE product_images
        SET sort_order = sort_order + 100
        WHERE product_id = :productId
        AND is_orphan = false
      `,
      { productId }
    );

    // === LOOP PAYLOAD ===
    for (const img of images) {
      // ===== CASE 1: REUSE =====
      if (img.id && !img.originalFileName) {
        const productImageId = Number(img.id);

        if (!existingImageMap.has(productImageId)) {
          throw AppError.badRequest("Invalid product image reference");
        }

        // update sort order
        await trx.raw(
          `
        UPDATE product_images
        SET sort_order = :sortOrder, updated_at = now()
        WHERE id = :id
        `,
          { id: productImageId, sortOrder: img.sortOrder }
        );

        usedProductImageIds.add(productImageId);
        activeCount++;
        continue;
      }

      // ===== CASE 2: REPLACE / ADD =====
      if (img.originalFileName) {
        const file = productImageFilesMap.get(img.sortOrder);
        if (!file) {
          throw AppError.badRequest("Missing uploaded product image");
        }

        // insert images_metadata
        const { rows: metaRows } = await trx.raw<{ rows: { id: number }[] }>(
          `
        INSERT INTO images_metadata
          (image_key, original_file_name, mime_type, file_size, width, height, original_available, context)
        VALUES
          (:image_key, :original_file_name, :mime_type, :file_size, :width, :height, :original_available, :context)
        RETURNING id
        `,
          {
            image_key: file.imageKey,
            original_file_name: file.originalFileName,
            mime_type: file.mimeType,
            file_size: file.size,
            width: file.width,
            height: file.height,
            original_available: file.originalAvailable,
            context: IMAGE_CONTEXT.PRODUCT
          }
        );

        const imageMetadataId = metaRows[0]?.id;
        if (!imageMetadataId) {
          throw AppError.internal();
        }

        // insert product_images
        const { rows: pImgRows } = await trx.raw<{ rows: { id: number }[] }>(
          `
        INSERT INTO product_images
          (product_id, image_id, sort_order, is_orphan)
        VALUES
          (:product_id, :image_id, :sort_order, false)
        RETURNING id
        `,
          {
            product_id: productId,
            image_id: imageMetadataId,
            sort_order: img.sortOrder
          }
        );

        const newProductImageId = pImgRows[0]?.id;
        if (!newProductImageId) {
          logger.error("Insert product_images returned no rows");
          throw AppError.internal();
        }

        usedProductImageIds.add(newProductImageId);
        activeCount++;
      }
    }

    // === ORPHAN OLD IMAGES ===
    for (const [productImageId] of existingImageMap) {
      if (!usedProductImageIds.has(productImageId)) {
        await trx.raw(
          `
        UPDATE product_images
        SET is_orphan = true, updated_at = now()
        WHERE id = :id
        `,
          { id: productImageId }
        );
      }
    }

    // === FINAL VALIDATION ===
    if (activeCount < 1) {
      throw AppError.badRequest("Product must have at least one image");
    }

    if (activeCount > PRODUCT_LIMITS.IMAGE_LIMIT) {
      throw AppError.badRequest(`Product images exceed maximum limit (${PRODUCT_LIMITS.IMAGE_LIMIT})`);
    }
  }

  private buildProductFilter(qParams: ProductQueryParamsSchema) {
    const { q, isVariant, status, stock } = qParams;

    let priceMin = qParams.priceMin;
    let priceMax = qParams.priceMax;

    if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
      [priceMin, priceMax] = [priceMax, priceMin];
    }

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

  private async insertProductCollections(trx: Knex.Transaction, productId: number, collectionIds: number[]) {
    const uniqueIds = [...new Set(collectionIds)];

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      SELECT id FROM collections
      WHERE id = ANY(:collectionIds)
    `,
      { collectionIds: uniqueIds }
    );

    if (rows.length !== collectionIds.length) {
      throw AppError.badRequest("One or more collections not found");
    }

    await trx.raw(
      `
      INSERT INTO product_collections (product_id, collection_id)
      SELECT :productId, unnest(:collectionIds::bigint[])
      `,
      {
        productId,
        collectionIds: uniqueIds
      }
    );
  }
}
