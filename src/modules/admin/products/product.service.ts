import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { deleteFile, uploadFile } from "@/libs/s3-client";
import { generateUniqueSlug } from "./product.slug";
import { ProductRepo } from "./product.repo";
import { ALLOWED_IMG_FORMAT } from "./product.constants";
import { TransactionManager } from "@/infra/db/transaction-manager";
import { ProductImageFilesMap, VariantImageFilesMap } from "./product.types";
import { validateAndMapProductImages, validateAndMapVariantImages } from "./product.image.validator";
import { ProductImageSchema, ProductQueryParamsSchema, ProductUpsertSchema, VariantDimensionSchema, VariantSchema } from "./product.schema";

export class ProductService {
  constructor(
    private tm: TransactionManager,
    private repo: ProductRepo
  ) {}

  getall = async (qParams: ProductQueryParamsSchema) => {
    const { page, limit } = qParams;

    const [items, total] = await Promise.all([this.repo.getAll(qParams), this.repo.getCount(qParams)]);
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
    return await this.repo.getDetailById(id);
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

        await this.repo.create(trx, input, finalIsVariant, slug, productImageFilesMap, variantImageFilesMap);
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
        const product = await this.repo.findBaseById(id, trx);

        const finalSlug = input.name === product.name ? product.slug : await generateUniqueSlug(trx, input.name);

        await this.repo.update(trx, id, input, finalIsVariant, finalSlug, productImageFilesMap, variantImageFilesMap);
      })
    );
  };

  remove = async (id: number) => {
    // 1. DB transaction
    const { imageIds, imageKeys } = await this.tm.transaction(async (trx) => {
      return this.repo.remove(trx, id);
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
      await this.repo.removeImagesMetadata(imageIds);
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
        height: processed.height
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
        height: processed.height
      });
    }

    return result;
  }

  private async processImage(file: Express.Multer.File) {
    let image: sharp.Sharp;
    let meta: sharp.Metadata;

    try {
      image = sharp(file.buffer);
      meta = await image.metadata(); // REAL IMAGE

      if (!meta.format || !ALLOWED_IMG_FORMAT.includes(meta.format as any)) {
        throw AppError.badRequest("Unsupported image format");
      }
    } catch {
      throw AppError.badRequest("Invalid or corrupted image file");
    }

    const resized = image.resize({
      width: 1200,
      height: 1200,
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
      width: finalMeta.width,
      height: finalMeta.height
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
