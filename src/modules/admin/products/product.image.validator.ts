import { AppError } from "@/errors/app-error";
import { ProductImageSchema, VariantDimensionSchema } from "./product.schema";

export function validateAndMapProductImages(images: ProductImageSchema[], files: Express.Multer.File[]): Map<number, Express.Multer.File> {
  // 1. ambil semua originalFileName
  const imageEntries = images
    .filter((img) => img.originalFileName)
    .map((img) => ({
      sortOrder: img.sortOrder,
      originalFileName: img.originalFileName!
    }));

  // shortcut
  if (imageEntries.length === 0) {
    if (files.length > 0) {
      throw AppError.badRequest("Unexpected product images uploaded");
    }
    return new Map();
  }

  // 2. duplicate originalFileName
  const nameSet = new Set<string>();
  for (const e of imageEntries) {
    if (nameSet.has(e.originalFileName)) {
      throw AppError.badRequest(`Duplicate image filename: ${e.originalFileName}`);
    }
    nameSet.add(e.originalFileName);
  }

  // 3. map upload
  const uploadedMap = new Map<string, Express.Multer.File>();
  for (const file of files) {
    if (uploadedMap.has(file.originalname)) {
      throw AppError.badRequest(`Duplicate uploaded file: ${file.originalname}`);
    }
    uploadedMap.set(file.originalname, file);
  }

  // 4. count match
  if (uploadedMap.size !== imageEntries.length) {
    throw AppError.badRequest("Product image count mismatch");
  }

  // 5. map sortOrder → file
  const imageMap = new Map<number, Express.Multer.File>();
  for (const e of imageEntries) {
    const file = uploadedMap.get(e.originalFileName);
    if (!file) {
      throw AppError.badRequest(`Missing product image file: ${e.originalFileName}`);
    }

    imageMap.set(e.sortOrder, file);
  }

  return imageMap;
}

export function validateAndMapVariantImages(
  variantDimensions: VariantDimensionSchema[],
  variantImgs: Express.Multer.File[]
): Map<string, Express.Multer.File> {
  // 1. ambil semua image entry dari payload
  const imageEntries: { optionId: string; originalFileName: string }[] = [];

  for (const dim of variantDimensions) {
    for (const opt of dim.options) {
      const img = opt.image;
      if (!img?.originalFileName) continue;

      imageEntries.push({
        optionId: String(opt.id),
        originalFileName: img.originalFileName
      });
    }
  }

  // shortcut: tidak ada image sama sekali
  if (imageEntries.length === 0) {
    if (variantImgs.length > 0) {
      throw AppError.badRequest("Unexpected variant images uploaded");
    }
    return new Map();
  }

  // 2. duplicate originalFileName di payload
  const nameSet = new Set<string>();
  for (const e of imageEntries) {
    if (nameSet.has(e.originalFileName)) {
      throw AppError.badRequest(`Duplicate variant image filename in payload: ${e.originalFileName}`);
    }
    nameSet.add(e.originalFileName);
  }

  // 3. build uploaded file map
  const uploadedMap = new Map<string, Express.Multer.File>();
  for (const file of variantImgs) {
    if (uploadedMap.has(file.originalname)) {
      throw AppError.badRequest(`Duplicate uploaded file: ${file.originalname}`);
    }
    uploadedMap.set(file.originalname, file);
  }

  // 4. jumlah harus match
  if (uploadedMap.size !== imageEntries.length) {
    throw AppError.badRequest(`Variant image count mismatch. Expected ${imageEntries.length}, got ${uploadedMap.size}`);
  }

  // 5. map optionId → file (existence check)
  const optionImageMap = new Map<string, Express.Multer.File>();

  for (const e of imageEntries) {
    const file = uploadedMap.get(e.originalFileName);
    if (!file) {
      throw AppError.badRequest(`Missing variant image file: ${e.originalFileName}`);
    }

    optionImageMap.set(e.optionId, file);
  }

  return optionImageMap;
}
