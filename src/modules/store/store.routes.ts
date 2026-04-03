import { Router } from "express";
import bannerRouter from "./marketing/banner.routes";
import categoryRouter from "./category/category.routes";
import productRouter from "./product/product.routes";
import collectionRouter from "./collection/collection.routes";
import { STORE_ROUTES } from "./store.constants";

const router = Router();

router.use(STORE_ROUTES.PRODUCT, productRouter);
router.use(STORE_ROUTES.CATEGORY, categoryRouter);
router.use(STORE_ROUTES.COLLECTION, collectionRouter);
router.use(STORE_ROUTES.BANNER, bannerRouter);

export default router;
