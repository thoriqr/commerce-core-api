import { Router } from "express";
import productRouter from "./products/products.route";
import categoryRouter from "./categories/categories.route";
import collectionRouter from "./collections/collections.route";
import bannerRouter from "./marketing/banners.route";

const router = Router();

const PRODUCT_ROUTE = "/products";
const CATEGORY_ROUTE = "/categories";
const COLLECTION_ROUTE = "/collections";
const BANNER_ROUTE = "/marketing/banners";

router.use(PRODUCT_ROUTE, productRouter);
router.use(CATEGORY_ROUTE, categoryRouter);
router.use(COLLECTION_ROUTE, collectionRouter);
router.use(BANNER_ROUTE, bannerRouter);

export default router;
