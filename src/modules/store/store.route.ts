import { Router } from "express";
import bannerRouter from "./marketing/banners.route";
import categoryRouter from "./categories/categories.route";
import productRouter from "./products/products.route";

const router = Router();

const PRODUCT_ROUTE = "/products";
const CATEGORY_ROUTE = "/categories";
const BANNER_ROUTE = "/marketing/banners";

router.use(CATEGORY_ROUTE, categoryRouter);
router.use(BANNER_ROUTE, bannerRouter);
router.use(PRODUCT_ROUTE, productRouter);

export default router;
