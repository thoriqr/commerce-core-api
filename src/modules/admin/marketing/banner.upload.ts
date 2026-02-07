import multer from "multer";
import { ALLOWED_TYPES } from "./banner.constants";

const storage = multer.memoryStorage();

export const bannerImageUpload = multer({
  storage,
  limits: {
    fileSize: 6 * 1024 * 1024 // 2MB
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype as any)) {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`));
      return;
    }

    cb(null, true);
  }
});
