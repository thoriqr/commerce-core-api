import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { deleteFile, uploadFile } from "@/libs/s3-client";
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

export class ProductService {
  constructor(
    private tm: TransactionManager,
    private readonly productRepo: ProductRepo,
    private readonly categoryRepo: CategoryRepo,
    private readonly collectionRepo: CollectionRepo
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

  create = async (input: ProductUpsertSchema, productImgs: Express.Multer.File[], variantImgs: Express.Multer.File[]) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    let productImageFilesMap: ProductImageFilesMap = new Map();
    let variantImageFilesMap: VariantImageFilesMap = new Map();

    productImageFilesMap = await this.prepareProductImages(input.images, productImgs);
    variantImageFilesMap = await this.prepareVariantImages(input.variantDimension, variantImgs);

    if (productImageFilesMap.size === 0) {
      throw AppError.badRequest("Product must have at least one image");
    }

    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueSlug(trx, input.name);

        await this.productRepo.create(trx, input, finalIsVariant, slug, productImageFilesMap, variantImageFilesMap);
      })
    );
  };

  update = async (id: number, input: ProductUpsertSchema, productImgs: Express.Multer.File[], variantImgs: Express.Multer.File[]) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    let productImageFilesMap: ProductImageFilesMap = new Map();
    let variantImageFilesMap: VariantImageFilesMap = new Map();

    productImageFilesMap = await this.prepareProductImages(input.images, productImgs);
    variantImageFilesMap = await this.prepareVariantImages(input.variantDimension, variantImgs);

    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const product = await this.productRepo.findBaseById(id, trx);

        const finalSlug = input.name === product.name ? product.slug : await generateUniqueSlug(trx, input.name);

        await this.productRepo.update(trx, id, input, finalIsVariant, finalSlug, productImageFilesMap, variantImageFilesMap);
      })
    );
  };

  updateStatus = async (input: UpdateProductStatusSchema) => {
    return await this.productRepo.updateStatus(input);
  };

  remove = async (id: number) => {
    // 1. DB transaction
    const { imageIds, imageKeys } = await this.tm.transaction(async (trx) => {
      return this.productRepo.remove(trx, id);
    });

    // 2. infra cleanup (best effort, OUTSIDE transaction)
    for (const key of imageKeys) {
      try {
        await deleteFile(key);
      } catch (err) {
        logger.error("Failed to delete product image from storage", { productId: id, imageKey: key, error: err });
      }
    }

    // delete images_metadata (best effort)
    try {
      await this.productRepo.removeImagesMetadata(imageIds);
    } catch (err) {
      logger.error("Failed to delete images metadata", { productId: id, imageIds, error: err });
    }
  };

  private async prepareProductImages(images: ProductImageSchema[], files: Express.Multer.File[]): Promise<ProductImageFilesMap> {
    const imageMap = validateAndMapProductImages(images, files);

    const result: ProductImageFilesMap = new Map();

    for (const [sortOrder, file] of imageMap) {
      const processed = await this.processImage(file);

      const imageKey = `products/${uuidv4()}.webp`;

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
      const imageKey = `product_variants/${uuidv4()}.webp`;

      try {
        await uploadFile(processed.buffer, imageKey, processed.mimeType);
      } catch (err) {
        logger.error("Failed to upload variant image", { optionId, imageKey, fileName: file.originalname });
        throw AppError.serviceUnavailable("Failed to upload variant image");
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
      meta = await image.metadata(); // ORIGINAL IMAGE

      if (!meta.format || !ALLOWED_IMG_FORMAT.includes(meta.format as any)) {
        throw AppError.badRequest("Unsupported image format");
      }
    } catch {
      throw AppError.badRequest("Invalid or corrupted image file");
    }

    if (!meta.width || !meta.height) {
      throw AppError.badRequest("Invalid image dimensions");
    }

    if (meta.width < PRODUCT_IMAGE_MIN_SIZE.width || meta.height < PRODUCT_IMAGE_MIN_SIZE.height) {
      throw AppError.badRequest(`Image too small. Minimum ${PRODUCT_IMAGE_MIN_SIZE.width}x${PRODUCT_IMAGE_MIN_SIZE.height}px`);
    }

    // CHECK ORIGINAL AVAILABLE
    const originalAvailable = meta.width <= PRODUCT_IMAGE_MAX_SIZE.width && meta.height <= PRODUCT_IMAGE_MAX_SIZE.height;

    const resized = image.resize({
      width: PRODUCT_IMAGE_MAX_SIZE.width,
      height: PRODUCT_IMAGE_MAX_SIZE.height,
      fit: "inside",
      withoutEnlargement: true
    });

    const buffer = await resized.toFormat("webp", { quality: 85 }).toBuffer();

    // ambil metadata SETELAH resize (final dimension)
    const finalMeta = await sharp(buffer).metadata();

    if (!finalMeta.width || !finalMeta.height) {
      throw AppError.badRequest("Failed to read resized image metadata");
    }

    return {
      buffer,
      mimeType: "image/webp",
      size: buffer.length,

      // FINAL IMAGE
      width: finalMeta.width,
      height: finalMeta.height,
      // ORIGINAL INFO
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
}
