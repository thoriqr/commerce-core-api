import { TransactionManager } from "@/infra/db/transaction-manager";
import { BannerRepo } from "./banner.repo";
import { BannerImageSchema, BannerUpsertSchema } from "./banner.schema";
import { AppError } from "@/errors/app-error";
import sharp from "sharp";
import { ALLOWED_IMG_FORMAT, BANNER_IMAGE_MAX_SIZE, BANNER_IMAGE_MIN_SIZE } from "./banner.constants";
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from "@/libs/s3-client";
import { ImagePayload } from "./banner.types";
import { Knex } from "knex";

export class BannerService {
  constructor(
    private tm: TransactionManager,
    private repo: BannerRepo
  ) {}

  create = async (input: BannerUpsertSchema, imageFile?: Express.Multer.File) => {
    return this.tm.transaction(async (trx) => {
      const resolvedTargetValue = await this.repo.resolveTarget(trx, input.targetType, input.targetValue);

      const imageId = await this.resolveBannerImage(trx, input.image, imageFile);

      await this.repo.create(
        trx,
        {
          ...input,
          targetValue: resolvedTargetValue
        },
        imageId
      );
    });
  };

  update = async (bannerId: number, input: BannerUpsertSchema, imageFile?: Express.Multer.File) => {
    return this.tm.transaction(async (trx) => {
      // resolve ID -> slug / slug-path
      const resolvedTargetValue = await this.repo.resolveTarget(trx, input.targetType, input.targetValue);

      // resolve image (reuse / upload)
      const imageId = await this.resolveBannerImage(trx, input.image, imageFile);

      await this.repo.update(
        trx,
        bannerId,
        {
          ...input,
          targetValue: resolvedTargetValue
        },
        imageId
      );
    });
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

    const imageKey = `banners/${uuidv4()}.webp`;

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

    if (meta.width < BANNER_IMAGE_MIN_SIZE.width || meta.height < BANNER_IMAGE_MIN_SIZE.height) {
      throw AppError.badRequest(`Image too small. Minimum ${BANNER_IMAGE_MIN_SIZE.width}x${BANNER_IMAGE_MIN_SIZE.height}px`);
    }

    // CHECK ORIGINAL AVAILABLE
    const originalAvailable = meta.width <= BANNER_IMAGE_MAX_SIZE.width && meta.height <= BANNER_IMAGE_MAX_SIZE.height;

    const resized = image.resize({
      width: BANNER_IMAGE_MAX_SIZE.width,
      height: BANNER_IMAGE_MAX_SIZE.height,
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
}
