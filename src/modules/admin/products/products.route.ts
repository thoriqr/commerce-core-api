import { db } from "@/infra/db/knex";
import { Router } from "express";
import { withMulter } from "@/middlewares/multer.middleware";
import { UPLOAD_FILE } from "./product.constants";
import { ProductRepo } from "./product.repo";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { productImageUpload } from "./product.upload";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new ProductRepo();
const service = new ProductService(tm, repo);
const controller = new ProductController(service);

router.get("/", controller.getAll);
router.get("/:productId", controller.getById);

router.post(
  "/",
  withMulter(
    productImageUpload.fields([
      { name: UPLOAD_FILE.PRODUCT_FIELD, maxCount: UPLOAD_FILE.MAX_PRODUCT_IMG },
      {
        name: UPLOAD_FILE.VARIANT_FIELD,
        maxCount: UPLOAD_FILE.MAX_VARIANT_IMG
      }
    ])
  ),
  controller.create
);

router.put(
  "/:productId",
  withMulter(
    productImageUpload.fields([
      { name: UPLOAD_FILE.PRODUCT_FIELD, maxCount: UPLOAD_FILE.MAX_PRODUCT_IMG },
      {
        name: UPLOAD_FILE.VARIANT_FIELD,
        maxCount: UPLOAD_FILE.MAX_VARIANT_IMG
      }
    ])
  ),
  controller.update
);

router.delete("/:productId", controller.remove);

export default router;
