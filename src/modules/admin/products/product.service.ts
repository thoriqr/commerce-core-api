import { TransactionManager } from "../../../infra/db/transaction-manager";
import { ProductRepo } from "./product.repo";
import { ProductQueryParamsSchema, ProductUpsertSchema, VariantSchema } from "./product.schema";
import { AppError } from "../../../errors/app-error";
import { generateUniqueSlug } from "./product.slug";
import sharp from "sharp";
import { validateAndMapVariantImages } from "./product.image.validator";
import { ALLOWED_IMG_FORMAT, ALLOWED_TYPES } from "./product.constants";
import { VariantImagesMap } from "./product.types";
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from "../../../libs/s3-client";

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

  create = async (input: ProductUpsertSchema, variantImgs: Express.Multer.File[]) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    const optionImageMap = validateAndMapVariantImages(input.variantDimension, variantImgs);
    const variantImagesMap: VariantImagesMap = new Map();

    for (const [optionId, file] of optionImageMap) {
      const processed = await this.processImage(file);

      const imageKey = `product_variants/${uuidv4()}.webp`;

      // 1. upload dulu
      try {
        await uploadFile(processed.buffer, imageKey, processed.mimeType);
      } catch (err) {
        throw AppError.serviceUnavailable(`Failed to upload image: ${file.originalname}, ${err}`);
      }

      // 2. baru simpan info ke map
      variantImagesMap.set(optionId, {
        imageKey,
        originalFileName: file.originalname,
        mimeType: processed.mimeType,
        size: processed.size,
        width: processed.width,
        height: processed.height
      });
    }

    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueSlug(trx, input.name);

        await this.repo.create(trx, input, finalIsVariant, slug, variantImagesMap);
      })
    );
  };

  update = async (id: number, input: ProductUpsertSchema) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const product = await this.repo.findBaseById(id, trx);

        const finalSlug = input.name === product.name ? product.slug : await generateUniqueSlug(trx, input.name);

        await this.repo.update(trx, id, input, finalIsVariant, finalSlug);
      })
    );
  };

  private processImage = async (file: Express.Multer.File) => {
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
  };

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
