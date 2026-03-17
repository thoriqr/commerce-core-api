import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { uploadFile } from "@/libs/s3-client";
import { generateUniqueSlug } from "./product.slug";
import { ProductRepo } from "./product.repo";
import { ALLOWED_IMG_FORMAT, PRODUCT_IMAGE_MAX_SIZE, PRODUCT_IMAGE_MIN_SIZE } from "./product.constants";
import { TransactionManager } from "@/infra/db/transaction-manager";
import { ProductImageFilesMap, VariantImageFilesMap } from "./product.types";
import { validateAndMapProductImages, validateAndMapVariantImages } from "./product.image.validator";
import {
  ProductImageSchema,
  ProductQueryParamsSchema,
  ProductUpsertSchema,
  UpdateProductStatusSchema,
  VariantDimensionSchema,
  VariantSchema
} from "./product.schema";
import { CategoryRepo } from "../categories/category.repo";
import { CollectionRepo } from "../collections/collection.repo";
import { VariantPresetRepo } from "../variant-presets/variant-preset.repo";
import { redis } from "@/libs/redis";
import { REDIS_KEYS } from "@/shared/cache/redis-keys";

export class ProductService {
  constructor(
    private tm: TransactionManager,
    private readonly productRepo: ProductRepo,
    private readonly categoryRepo: CategoryRepo,
    private readonly collectionRepo: CollectionRepo,
    private readonly variantPresetRepo: VariantPresetRepo
  ) {}

  getall = async (qParams: ProductQueryParamsSchema) => {
    const { page, limit } = qParams;

    const [items, total] = await Promise.all([this.productRepo.getAll(qParams), this.productRepo.getCount(qParams)]);
    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  };

  getById = async (id: number) => {
    return await this.productRepo.getDetailById(id);
  };

  getCategoryOptions = async () => {
    return await this.categoryRepo.getFlatForProduct();
  };

  getCollectionOptions = async () => {
    return await this.collectionRepo.getOptions();
  };

  getDimensionOptions = async () => {
    return this.variantPresetRepo.getDimensionOptions();
  };

  getValuesByDimensionName = async (name: string) => {
    return this.variantPresetRepo.getValuesByDimensionName(name);
  };

  create = async (input: ProductUpsertSchema, productImgs: Express.Multer.File[], variantImgs: Express.Multer.File[]) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    let productImageFilesMap: ProductImageFilesMap = new Map();
    let variantImageFilesMap: VariantImageFilesMap = new Map();

    productImageFilesMap = await this.prepareProductImages(input.images, productImgs);
    variantImageFilesMap = await this.prepareVariantImages(input.variantDimension, variantImgs);

    if (productImageFilesMap.size === 0) {
      throw AppError.badRequest("Product must have at least one image");
    }

    await this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueSlug(trx, input.name);

        await this.productRepo.create(trx, input, finalIsVariant, slug, productImageFilesMap, variantImageFilesMap);
      })
    );

    // invalidate variant whitelist cache
    await this.invalidateVariantCache();
  };

  update = async (id: number, input: ProductUpsertSchema, productImgs: Express.Multer.File[], variantImgs: Express.Multer.File[]) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    let productImageFilesMap: ProductImageFilesMap = new Map();
    let variantImageFilesMap: VariantImageFilesMap = new Map();

    productImageFilesMap = await this.prepareProductImages(input.images, productImgs);
    variantImageFilesMap = await this.prepareVariantImages(input.variantDimension, variantImgs);

    await this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const product = await this.productRepo.findBaseById(id, trx);

        const finalSlug = input.name === product.name ? product.slug : await generateUniqueSlug(trx, input.name);

        await this.productRepo.update(trx, id, input, finalIsVariant, finalSlug, productImageFilesMap, variantImageFilesMap);
      })
    );

    // invalidate variant whitelist cache AFTER transaction commit
    await this.invalidateVariantCache();
    // invalidate variant images for storefront
    await this.invalidateVariantImageCache(id);
  };

  updateStatus = async (input: UpdateProductStatusSchema) => {
    return await this.productRepo.updateStatus(input);
  };

  private async prepareProductImages(images: ProductImageSchema[], files: Express.Multer.File[]): Promise<ProductImageFilesMap> {
    const imageMap = validateAndMapProductImages(images, files);

    const result: ProductImageFilesMap = new Map();

    for (const [sortOrder, file] of imageMap) {
      const processed = await this.processImage(file);
      const extension = processed.mimeType.split("/")[1];
      const imageKey = `products/${uuidv4()}.${extension}`;

      try {
        await uploadFile(processed.buffer, imageKey, processed.mimeType);
      } catch {
        throw AppError.serviceUnavailable(`Failed to upload image: ${file.originalname}`);
      }

      result.set(sortOrder, {
        imageKey,
        originalFileName: file.originalname,
        mimeType: processed.mimeType,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        originalHeight: processed.originalHeight,
        originalWidth: processed.originalWidth,
        originalAvailable: processed.originalAvailable
      });
    }

    return result;
  }

  private async prepareVariantImages(variantDimensions: VariantDimensionSchema[], variantImgs: Express.Multer.File[]) {
    // 1. structural validation + optionId → file
    const optionImageMap = validateAndMapVariantImages(variantDimensions, variantImgs);

    if (optionImageMap.size === 0) {
      return new Map();
    }

    const result: VariantImageFilesMap = new Map();

    for (const [optionId, file] of optionImageMap) {
      // sharp validation + resize
      const processed = await this.processImage(file);

      // generate key
      const extension = processed.mimeType.split("/")[1];
      const imageKey = `product_variants/${uuidv4()}.${extension}`;

      try {
        await uploadFile(processed.buffer, imageKey, processed.mimeType);
      } catch (err) {
        logger.error("Failed to upload variant image", { optionId, imageKey, fileName: file.originalname });
        throw AppError.serviceUnavailable(`Failed to upload image: ${file.originalname}`);
      }

      // collect final metadata
      result.set(optionId, {
        imageKey,
        originalFileName: file.originalname,
        mimeType: processed.mimeType,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        originalHeight: processed.originalHeight,
        originalWidth: processed.originalWidth,
        originalAvailable: processed.originalAvailable
      });
    }

    return result;
  }

  private async processImage(file: Express.Multer.File) {
    let image: sharp.Sharp;
    let meta: sharp.Metadata;

    try {
      image = sharp(file.buffer);
      meta = await image.metadata();
    } catch {
      throw AppError.badRequest("Invalid or corrupted image file");
    }

    if (!meta.format || !ALLOWED_IMG_FORMAT.includes(meta.format as any)) {
      throw AppError.badRequest("Unsupported image format");
    }

    if (!meta.width || !meta.height) {
      throw AppError.badRequest("Invalid image dimensions");
    }

    if (meta.width < PRODUCT_IMAGE_MIN_SIZE.width || meta.height < PRODUCT_IMAGE_MIN_SIZE.height) {
      throw AppError.badRequest(`Image too small. Minimum ${PRODUCT_IMAGE_MIN_SIZE.width}x${PRODUCT_IMAGE_MIN_SIZE.height}px`);
    }

    const needsResize = meta.width > PRODUCT_IMAGE_MAX_SIZE.width || meta.height > PRODUCT_IMAGE_MAX_SIZE.height;

    const originalAvailable = !needsResize;

    if (needsResize) {
      image = image.resize({
        width: PRODUCT_IMAGE_MAX_SIZE.width,
        height: PRODUCT_IMAGE_MAX_SIZE.height,
        fit: "inside",
        withoutEnlargement: true
      });
    }

    // Always convert to webp q80
    const { data, info } = await image
      .webp({
        quality: 80
      })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      mimeType: "image/webp", // force webp
      size: data.length,

      width: info.width,
      height: info.height,

      originalWidth: meta.width,
      originalHeight: meta.height,
      originalAvailable
    };
  }

  private validateVariantRules(variants: VariantSchema[]) {
    const finalIsVariant = variants.length > 1;
    const primaries = variants.filter((v) => v.isPrimary);

    if (primaries.length !== 1) {
      throw AppError.badRequest("Exactly one primary variant is required");
    }

    // SINGLE PRODUCT MUST NOT HAVE options
    if (!finalIsVariant) {
      const hasOptions = variants[0]?.options?.length;
      if (hasOptions) {
        throw AppError.badRequest("Single product must not have variant options");
      }
    }

    // VARIANT PRODUCT MUST HAVE options
    if (finalIsVariant) {
      for (const v of variants) {
        if (!v.options || v.options.length === 0) {
          throw AppError.badRequest("Variant product must have options");
        }
      }
    }

    // RULE:
    // - single variant must not have options
    // - multi variant must have options
    // - exactly one primary variant

    return finalIsVariant;
  }

  private async withSlugRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      // retry if unique violation
      if (err?.code === "23505" && attempt < 1) {
        return this.withSlugRetry(fn, attempt + 1);
      }
      throw err;
    }
  }

  private async invalidateVariantCache() {
    await redis.del([REDIS_KEYS.VARIANT_DIMENSIONS, REDIS_KEYS.VARIANT_VALUES]);
  }

  private async invalidateVariantImageCache(productId: number) {
    await redis.del(REDIS_KEYS.VARIANT_IMAGES(productId));
  }
}
