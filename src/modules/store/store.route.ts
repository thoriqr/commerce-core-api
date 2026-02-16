import { Router } from "express";
import bannerRouter from "./marketing/banners.route";

const router = Router();

const BANNER_ROUTE = "/marketing/banners";

router.use(BANNER_ROUTE, bannerRouter);

export default router;
