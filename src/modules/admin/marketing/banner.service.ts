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

      if (!image.crop) {
        throw AppError.badRequest("Missing crop data for uploaded banner image");
      }

      const payload: ImagePayload = await this.prepareBannerImage(image, imageFile, image.crop);

      imageId = await this.repo.insertBannerImage(trx, payload);
    } else {
      imageId = Number(image.id);
    }

    return imageId;
  }

  private async prepareBannerImage(
    image: BannerImageSchema,
    file: Express.Multer.File,
    crop: { x: number; y: number; width: number; height: number }
  ) {
    if (image.originalFileName !== file.originalname) {
      throw AppError.badRequest(`Missing banner image file: ${image.originalFileName}`);
    }

    const processed = await this.processImage(file, crop);

    const extension = processed.mimeType.split("/")[1];
    const imageKey = `banners/${uuidv4()}.${extension}`;

    await uploadFile(processed.buffer, imageKey, processed.mimeType);

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

  private async processImage(file: Express.Multer.File, crop: { x: number; y: number; width: number; height: number }) {
    let meta: sharp.Metadata;

    try {
      meta = await sharp(file.buffer).metadata();
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

    // Validate crop boundary
    if (crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > meta.width || crop.y + crop.height > meta.height) {
      throw AppError.badRequest("Invalid crop area");
    }

    // ✅ Optional: validate 3:1 ratio
    const ratio = crop.width / crop.height;
    if (Math.abs(ratio - 3) > 0.01) {
      throw AppError.badRequest("Invalid crop ratio. Expected 3:1");
    }

    const { data, info } = await sharp(file.buffer)
      .extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height)
      })
      .resize(1200, 400)
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      mimeType: "image/webp",
      size: data.length,
      width: info.width, // 1200
      height: info.height, // 400
      originalWidth: meta.width,
      originalHeight: meta.height,
      originalAvailable: false
    };
  }
}
