import multer from "multer";
import { ALLOWED_TYPES, UPLOAD_FILE } from "./banner.constants";

const storage = multer.memoryStorage();

export const bannerImageUpload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_FILE.BANNER_FILE_SIZE
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype as any)) {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`));
      return;
    }

    cb(null, true);
  }
});
