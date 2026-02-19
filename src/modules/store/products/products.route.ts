import { Router } from "express";
import { ProductRepo } from "./product.repo";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";

const router = Router();

const repo = new ProductRepo();
const service = new ProductService(repo);
const controller = new ProductController(service);

router.get("/:slug", controller.getProductDetail);
router.get("/:productSlug/variants/:variantId", controller.getVariantDetail);
router.get("/by-category", controller.getByCategory);
router.get("/by-collection", controller.getByCollection);
router.get("/by-search", controller.getBySearch);

export default router;
