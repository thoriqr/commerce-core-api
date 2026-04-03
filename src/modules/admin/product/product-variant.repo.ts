import { Knex } from "knex";
import { ProductVariantStatus, VariantImageFilesMap } from "./product.types";
import { VariantDimensionSchema, VariantSchema } from "./product.schema";
import { AppError } from "@/errors/app-error";
import { displayName, displayValue, normalizeName, normalizeSku, normalizeValue } from "./product.normalizer";
import { logger } from "@/libs/logger";
import { IMAGE_CONTEXT } from "@/constants/image-context";

export class ProductVariantRepo {
  async getVariantStatusMap(trx: Knex.Transaction, productId: number): Promise<Map<number, string>> {
    const { rows } = await trx.raw<{ rows: { id: number; status: ProductVariantStatus }[] }>(
      `
        SELECT id, status FROM product_variants WHERE product_id = :productId  
      `,
      { productId }
    );

    return new Map<number, string>(rows.map((r) => [r.id, r.status]));
  }

  async archiveMissingVariants(trx: Knex.Transaction, productId: number, payloadIds: Set<number>) {
    await trx.raw(
      `
    UPDATE product_variants
    SET status = 'ARCHIVED'
    WHERE product_id = :productId
      AND status <> 'ARCHIVED'
      AND (
        :payloadIdsCount = 0
        OR NOT (id = ANY(:payloadIds))
      )
    `,
      {
        productId,
        payloadIds: Array.from(payloadIds),
        payloadIdsCount: payloadIds.size
      }
    );
  }

  async updateExistingVariants(
    trx: Knex.Transaction,
    productId: number,
    existingVariants: VariantSchema[],
    dbVariantMap: Map<number, string>,
    snapshotLookup: Map<
      string,
      {
        dimensionName: string;
        value: string;
      }
    > | null
  ) {
    const idMap = new Map<string, number>();

    for (const v of existingVariants) {
      if (!v.id) {
        throw AppError.badRequest("Missing variant id for existing variant");
      }

      const id = Number(v.id);

      if (!Number.isInteger(id)) {
        throw AppError.badRequest(`Invalid variant id: ${v.id}`);
      }

      const currentStatus = dbVariantMap.get(id);

      if (!currentStatus) {
        throw AppError.badRequest(`Invalid variant id: ${id}`);
      }

      if (currentStatus === "ARCHIVED") {
        throw AppError.badRequest(`Variant ${id} is archived and cannot be modified`);
      }

      // Build snapshot di sini
      const snapshot = snapshotLookup && v.options?.length ? this.buildVariantSnapshot(v, snapshotLookup) : null;

      const { rows } = await trx.raw<{ rows: { id: number }[] }>(
        `
      UPDATE product_variants
      SET price = :price,
          stock = :stock,
          weight = :weight,
          sku = :sku,
          is_primary = :isPrimary,
          status = 'ACTIVE',
          option_snapshot = :snapshot
      WHERE id = :id
      AND product_id = :productId
      RETURNING id
      `,
        {
          id,
          productId,
          price: v.price,
          stock: v.stock,
          weight: v.weight,
          sku: normalizeSku(v.sku),
          isPrimary: v.isPrimary,
          snapshot
        }
      );

      if (!rows[0]) {
        logger.error("update product_variants returned no rows");
        throw AppError.internal();
      }

      // FE id (string) → DB id (number)
      idMap.set(String(v.id), rows[0].id);
    }

    return idMap;
  }

  async insertNewVariants(
    trx: Knex.Transaction,
    productId: number,
    newVariants: VariantSchema[],
    snapshotLookup: Map<
      string,
      {
        dimensionName: string;
        value: string;
      }
    > | null
  ) {
    const idMap = new Map<string, number>();

    for (const v of newVariants) {
      const snapshot = snapshotLookup && v.options?.length ? this.buildVariantSnapshot(v, snapshotLookup) : null;

      const { rows } = await trx.raw<{ rows: { id: number }[] }>(
        `
        INSERT INTO product_variants
         (product_id, price, stock, weight, sku, is_primary, option_snapshot)
        VALUES
          (:productId, :price, :stock, :weight, :sku, :is_primary, :snapshot)
        RETURNING id
      `,
        {
          productId,
          price: v.price,
          stock: v.stock,
          weight: v.weight,
          sku: normalizeSku(v.sku),
          is_primary: v.isPrimary,
          snapshot
        }
      );

      if (!rows[0]) {
        logger.error("Insert product_variants returned no rows");
        throw AppError.internal();
      }

      idMap.set(String(v.clientId), rows[0].id);
    }

    return idMap;
  }

  async clearAllDimensionsAndPivot(trx: Knex.Transaction, productId: number) {
    // delete pivot
    await trx.raw(
      `
    DELETE FROM product_variant_option_values
    WHERE variant_id IN (
      SELECT id
      FROM product_variants
      WHERE product_id = :productId
    )
    `,
      { productId }
    );

    // delete values
    await trx.raw(
      `
    DELETE FROM product_variant_dimension_values
    WHERE dimension_id IN (
      SELECT id
      FROM product_variant_dimensions
      WHERE product_id = :productId
    )
    `,
      { productId }
    );

    // delete dimensions
    await trx.raw(
      `
    DELETE FROM product_variant_dimensions
    WHERE product_id = :productId
    `,
      { productId }
    );
  }

  async rebuildDimensionsAndPivot(
    trx: Knex.Transaction,
    productId: number,
    dims: VariantDimensionSchema[],
    variants: VariantSchema[],
    variantIdMap: Map<string, number>
  ) {
    await this.clearAllDimensionsAndPivot(trx, productId);

    // 4️⃣ INSERT new dimensions
    const dimensionIdMap = new Map<string, number>();

    for (const dim of dims) {
      const { rows } = await trx.raw<{ rows: { id: number }[] }>(
        `
      INSERT INTO product_variant_dimensions
        (product_id, name, normalized_name, display_name)
      VALUES
        (:productId, :name, :normalizedName, :displayName)
      RETURNING id
      `,
        {
          productId,
          name: dim.name,
          normalizedName: normalizeName(dim.name),
          displayName: displayName(dim.name)
        }
      );

      if (!rows[0]) {
        logger.error("Insert product_variant_dimensions returned no rows");
        throw AppError.internal();
      }

      dimensionIdMap.set(String(dim.id), rows[0].id);
    }

    // 5️⃣ INSERT values
    const valueIdMap = new Map<string, number>();

    for (const dim of dims) {
      const dbDimensionId = dimensionIdMap.get(String(dim.id));
      if (!dbDimensionId) {
        throw AppError.internal(`Unknown variant dimension id: ${dim.id}`);
      }

      for (const opt of dim.options) {
        const { rows } = await trx.raw<{ rows: { id: number }[] }>(
          `
        INSERT INTO product_variant_dimension_values
          (dimension_id, value, normalized_value, display_value, hex_color)
        VALUES
          (:dimensionId, :value, :normalizedValue, :displayValue, :hexColor)
        RETURNING id
        `,
          {
            dimensionId: dbDimensionId,
            value: opt.value,
            normalizedValue: normalizeValue(opt.value),
            displayValue: displayValue(opt.value),
            hexColor: opt.hexColor ?? null
          }
        );

        if (!rows[0]) {
          logger.error("Insert product_variant_dimension_values returned no rows");
          throw AppError.internal();
        }

        valueIdMap.set(String(opt.id), rows[0].id);
      }
    }

    // 6️⃣ INSERT pivot (ACTIVE variants only)
    for (const variant of variants) {
      const key = this.resolveVariantKey(variant);
      const dbVariantId = variantIdMap.get(key);
      if (!dbVariantId) continue;

      for (const opt of variant.options) {
        const dbDimensionId = dimensionIdMap.get(String(opt.dimensionId));
        const dbValueId = valueIdMap.get(String(opt.optionId));

        if (!dbDimensionId || !dbValueId) {
          logger.error("Pivot mapping error");
          throw AppError.internal();
        }

        await trx.raw(
          `
        INSERT INTO product_variant_option_values
          (variant_id, dimension_id, value_id)
        VALUES
          (:variantId, :dimensionId, :valueId)
        `,
          {
            variantId: dbVariantId,
            dimensionId: dbDimensionId,
            valueId: dbValueId
          }
        );
      }
    }
  }

  async updateVariantImageSignatures(trx: Knex.Transaction, productId: number, variantDimensions: VariantDimensionSchema[]): Promise<Set<number>> {
    const usedImageIds = new Set<number>();

    for (const dim of variantDimensions) {
      for (const opt of dim.options) {
        const img = opt.image;

        // CASE 1: reuse existing image (no new upload)
        if (!img?.id || img.originalFileName) {
          continue;
        }

        const imageId = Number(img.id);

        if (!Number.isInteger(imageId)) {
          throw AppError.badRequest("Invalid variant image reference");
        }

        // validasi image milik product ini
        const { rows } = await trx.raw<{ rows: { id: number }[] }>(
          `
        SELECT id
        FROM product_variant_images
        WHERE id = :id
          AND product_id = :productId
        `,
          {
            id: imageId,
            productId
          }
        );

        if (!rows[0]) {
          throw AppError.badRequest(`Invalid variant image reference: ${imageId}`);
        }

        // 🔥 delete signature lama (runtime descriptor only)
        await trx.raw(
          `
        DELETE FROM product_variant_image_signatures
        WHERE variant_image_id = :variantImageId
        `,
          { variantImageId: imageId }
        );

        // 🔥 insert signature baru dengan normalized terbaru
        await trx.raw(
          `
        INSERT INTO product_variant_image_signatures
          (variant_image_id, dimension_key, value_key)
        VALUES
          (:variantImageId, :dimensionKey, :valueKey)
        `,
          {
            variantImageId: imageId,
            dimensionKey: normalizeName(dim.name),
            valueKey: normalizeValue(opt.value)
          }
        );

        usedImageIds.add(imageId);
      }
    }

    return usedImageIds;
  }

  async handleNewAndRemovedVariantImages(
    trx: Knex.Transaction,
    productId: number,
    variantDimensions: VariantDimensionSchema[],
    variantImageFilesMap: VariantImageFilesMap,
    usedImageIds: Set<number>
  ) {
    // 🔹 Ambil semua image runtime lama
    const { rows: existingRows } = await trx.raw<{
      rows: { id: number }[];
    }>(
      `
    SELECT id
    FROM product_variant_images
    WHERE product_id = :productId
      AND is_orphan = false
    `,
      { productId }
    );

    const existingImageIds = new Set(existingRows.map((r) => r.id));

    // 🔹 Loop payload
    for (const dim of variantDimensions) {
      for (const opt of dim.options) {
        // ===== CASE 2: replace image (upload baru) =====
        if (variantImageFilesMap.has(opt.id)) {
          const img = variantImageFilesMap.get(opt.id)!;

          // insert images_metadata
          const { rows: metaRows } = await trx.raw<{ rows: { id: number }[] }>(
            `
          INSERT INTO images_metadata
            (image_key, original_file_name, mime_type, file_size, width, height, original_available, context)
          VALUES
            (:imageKey, :originalFileName, :mimeType, :fileSize, :width, :height, :originalAvailable, :context)
          RETURNING id
          `,
            {
              imageKey: img.imageKey,
              originalFileName: img.originalFileName,
              mimeType: img.mimeType,
              fileSize: img.size,
              width: img.width,
              height: img.height,
              originalAvailable: img.originalAvailable,
              context: IMAGE_CONTEXT.PRODUCT_VARIANT
            }
          );

          if (!metaRows[0]) {
            throw AppError.internal("Insert images_metadata failed");
          }

          const imageMetadataId = metaRows[0].id;

          // insert product_variant_images
          const { rows: pviRows } = await trx.raw<{ rows: { id: number }[] }>(
            `
          INSERT INTO product_variant_images
            (product_id, image_id, is_orphan)
          VALUES
            (:productId, :imageId, false)
          RETURNING id
          `,
            {
              productId,
              imageId: imageMetadataId
            }
          );

          if (!pviRows[0]) {
            throw AppError.internal("Insert product_variant_images failed");
          }

          const variantImageId = pviRows[0].id;

          // insert signature runtime
          await trx.raw(
            `
          INSERT INTO product_variant_image_signatures
            (variant_image_id, dimension_key, value_key)
          VALUES
            (:variantImageId, :dimensionKey, :valueKey)
          `,
            {
              variantImageId,
              dimensionKey: normalizeName(dim.name),
              valueKey: normalizeValue(opt.value)
            }
          );

          usedImageIds.add(variantImageId);
          continue;
        }

        // ===== CASE 3: no image (remove) =====
        if (!opt.image) {
          // tidak perlu apa-apa
          // akan di-handle di final orphan
          continue;
        }
      }
    }

    // 🔥 FINAL ORPHAN STEP
    for (const imageId of existingImageIds) {
      if (!usedImageIds.has(imageId)) {
        await trx.raw(
          `
        UPDATE product_variant_images
        SET is_orphan = true
        WHERE id = :id
        `,
          { id: imageId }
        );
      }
    }
  }

  async clearAllVariantImages(trx: Knex.Transaction, productId: number) {
    // delete signatures
    await trx.raw(
      `
    DELETE FROM product_variant_image_signatures
    WHERE variant_image_id IN (
      SELECT id FROM product_variant_images
      WHERE product_id = :productId
    )
    `,
      { productId }
    );

    // orphan all runtime images
    await trx.raw(
      `
    UPDATE product_variant_images
    SET is_orphan = true
    WHERE product_id = :productId
    `,
      { productId }
    );
  }

  async productHadDimensions(trx: Knex.Transaction, productId: number): Promise<boolean> {
    const { rows } = await trx.raw(
      `
    SELECT 1
    FROM product_variant_dimensions
    WHERE product_id = :productId
    LIMIT 1
    `,
      { productId }
    );

    return rows.length > 0;
  }

  private buildVariantSnapshot(variant: VariantSchema, snapshotLookup: Map<string, { dimensionName: string; value: string }>) {
    const snapshot = variant.options.map((opt) => {
      const meta = snapshotLookup.get(String(opt.optionId));
      if (!meta) {
        logger.error("Invalid option mapping");
        throw AppError.internal();
      }

      return {
        dimension: meta.dimensionName,
        value: meta.value
      };
    });

    // 🔥 Canonical sorting di sini
    snapshot.sort((a, b) => {
      if (a.dimension === b.dimension) {
        return a.value.localeCompare(b.value);
      }
      return a.dimension.localeCompare(b.dimension);
    });

    return JSON.stringify(snapshot);
  }

  private resolveVariantKey(variant: VariantSchema): string {
    return String(variant.id ?? variant.clientId);
  }
}
