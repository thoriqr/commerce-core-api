import multer from "multer";
import { ALLOWED_IMG_FORMAT, ALLOWED_TYPES, UPLOAD_FILE } from "./product.constants";

const storage = multer.memoryStorage();

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_FILE.PRODUCT_FILE_SIZE
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype as any)) {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMG_FORMAT.join(", ")}`));
      return;
    }

    cb(null, true);
  }
});
