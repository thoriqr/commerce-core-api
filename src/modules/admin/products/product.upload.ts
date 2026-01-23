import multer from "multer";
import { ALLOWED_TYPES } from "./product.constants";

const storage = multer.memoryStorage();

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype as any)) {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`));
      return;
    }

    cb(null, true);
  }
});
