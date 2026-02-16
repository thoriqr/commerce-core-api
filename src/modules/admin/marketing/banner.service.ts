import { TransactionManager } from "@/infra/db/transaction-manager";
import { BannerRepo } from "./banner.repo";
import { BannerImageSchema, BannerImagesQueryParamsSchema, BannerReorderSchema, BannerUpsertSchema } from "./banner.schema";
import { AppError } from "@/errors/app-error";
import sharp from "sharp";
import { ALLOWED_IMG_FORMAT, BANNER_IMAGE_MAX_SIZE, BANNER_IMAGE_MIN_SIZE } from "./banner.constants";
import { v4 as uuidv4 } from "uuid";
import { deleteFile, uploadFile } from "@/libs/s3-client";
import { ImagePayload } from "./banner.types";
import { Knex } from "knex";
import { logger } from "@/libs/logger";

export class BannerService {
  constructor(
    private tm: TransactionManager,
    private repo: BannerRepo
  ) {}

  getAll = async () => {
    return this.repo.getAll();
  };

  getById = async (bannerId: number) => {
    return this.repo.getById(bannerId);
  };

  create = async (input: BannerUpsertSchema, imageFile?: Express.Multer.File) => {
    return this.tm.transaction(async (trx) => {
      const imageId = await this.resolveBannerImage(trx, input.image, imageFile);

      await this.repo.create(trx, input, imageId);
    });
  };

  update = async (bannerId: number, input: BannerUpsertSchema, imageFile?: Express.Multer.File) => {
    return this.tm.transaction(async (trx) => {
      // resolve image (reuse / upload)
      const imageId = await this.resolveBannerImage(trx, input.image, imageFile);

      await this.repo.update(trx, bannerId, input, imageId);
    });
  };

  remove = async (bannerId: number) => {
    return this.repo.remove(bannerId);
  };

  reorderBanner = async (input: BannerReorderSchema) => {
    await this.tm.transaction((trx) => this.repo.reorderBanner(trx, input));
  };

  getBannerImages = async (qParams: BannerImagesQueryParamsSchema) => {
    const { page, limit } = qParams;

    const { images, total } = await this.repo.getBannerImages(qParams);

    return {
      data: images,
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

  removeBannerImage = async (imageId: number) => {
    const { image_key } = await this.repo.snapShotBannerImage(imageId);

    await this.repo.removeBannerImageMetadata(imageId);

    try {
      await deleteFile(image_key);
    } catch (err) {
      logger.error("Failed to delete banner image from storage", { imageId, imageKey: image_key, error: err });
    }
  };

  private async resolveBannerImage(trx: Knex.Transaction, image: BannerImageSchema, imageFile?: Express.Multer.File): Promise<number> {
    let imageId: number;

    if (imageFile) {
      if (!image.originalFileName) {
        throw AppError.badRequest("Missing image originalFileName");
      }

      const payload: ImagePayload = await this.prepareBannerImage(image, imageFile);

      imageId = await this.repo.insertBannerImage(trx, payload);
    } else {
      imageId = Number(image.id);
    }

    return imageId;
  }

  private async prepareBannerImage(image: BannerImageSchema, file: Express.Multer.File) {
    if (image.originalFileName !== file.originalname) {
      throw AppError.badRequest(`Missing banner image file: ${image.originalFileName}`);
    }

    const processed = await this.processImage(file);
    const extension = processed.mimeType.split("/")[1];
    const imageKey = `banners/${uuidv4()}.${extension}`;

    try {
      await uploadFile(processed.buffer, imageKey, processed.mimeType);
    } catch {
      throw AppError.serviceUnavailable(`Failed to upload image: ${file.originalname}`);
    }

    return {
      imageKey,
      originalFileName: file.originalname,
      mimeType: processed.mimeType,
      size: processed.size,
      width: processed.width,
      height: processed.height,
      originalHeight: processed.originalHeight,
      originalWidth: processed.originalWidth,
      originalAvailable: processed.originalAvailable
    };
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

    if (meta.width < BANNER_IMAGE_MIN_SIZE.width || meta.height < BANNER_IMAGE_MIN_SIZE.height) {
      throw AppError.badRequest(`Image too small. Minimum ${BANNER_IMAGE_MIN_SIZE.width}x${BANNER_IMAGE_MIN_SIZE.height}px`);
    }

    const needsResize = meta.width > BANNER_IMAGE_MAX_SIZE.width || meta.height > BANNER_IMAGE_MAX_SIZE.height;

    const originalAvailable = !needsResize;

    if (needsResize) {
      image = image.resize({
        width: BANNER_IMAGE_MAX_SIZE.width,
        height: BANNER_IMAGE_MAX_SIZE.height,
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
}
