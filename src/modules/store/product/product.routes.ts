import { Router } from "express";
import { ProductRepo } from "./product.repo";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { searchLimiter } from "@/middlewares/rate-limit.middleware";

const router = Router();

const repo = new ProductRepo();
const service = new ProductService(repo);
const controller = new ProductController(service);

router.get("/by-category", searchLimiter, controller.getByCategory);
router.get("/by-collection", searchLimiter, controller.getByCollection);
router.get("/by-search", searchLimiter, controller.getBySearch);
router.get("/filters", searchLimiter, controller.getSearchFilters);
router.get("/:productId", controller.getProductDetail);
router.get("/:productId/variants/:variantId", controller.getVariantDetail);

export default router;
