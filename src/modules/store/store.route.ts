import { Router } from "express";
import bannerRouter from "./marketing/banners.route";
import categoryRouter from "./categories/categories.route";

const router = Router();

const CATEGORY_ROUTE = "/categories";
const BANNER_ROUTE = "/marketing/banners";

router.use(CATEGORY_ROUTE, categoryRouter);
router.use(BANNER_ROUTE, bannerRouter);

export default router;
