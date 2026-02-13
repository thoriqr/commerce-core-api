import { Router } from "express";
import { db } from "@/infra/db/knex";
import { ProductRepo } from "./product.repo";
import { UPLOAD_FILE } from "./product.constants";
import { ProductService } from "./product.service";
import { productImageUpload } from "./product.upload";
import { ProductController } from "./product.controller";
import { withMulter } from "@/middlewares/multer.middleware";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { CategoryRepo } from "../categories/category.repo";
import { CollectionRepo } from "../collections/collection.repo";
import { ProductVariantRepo } from "./product-variant.repo";
import { VariantPresetRepo } from "../variant-presets/variant-preset.repo";

const router = Router();

const tm = new KnexTransactionManager(db);

const variantRepo = new ProductVariantRepo();
const productRepo = new ProductRepo(variantRepo);
const categoryRepo = new CategoryRepo();
const collectionRepo = new CollectionRepo();
const variantPresetRepo = new VariantPresetRepo();
const service = new ProductService(tm, productRepo, categoryRepo, collectionRepo, variantPresetRepo);
const controller = new ProductController(service);

router.get("/", controller.getAll);
router.get("/:productId", controller.getById);
router.get("/options/category", controller.getCategoryOptions);
router.get("/options/collection", controller.getCollectionOptions);
router.get("/options/dimension-preset", controller.getDimensionOptions);
router.get("/options/dimension-preset/:dimensionPresetName", controller.getValuesByDimensionName);

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

router.patch("/actions/status", controller.updateStatus);

router.delete("/:productId", controller.remove);

export default router;
