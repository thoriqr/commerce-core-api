import { AppError } from "@/errors/app-error";
import { BannerImageSchema } from "./banner.schema";

export function validateBannerImage(image: BannerImageSchema, file: Express.Multer.File) {
  if (image.originalFileName !== file.filename) {
    throw AppError.badRequest(`Missing product image file: ${image.originalFileName}`);
  }
}
