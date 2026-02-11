import { Router } from "express";
import productRouter from "./products/products.route";
import categoryRouter from "./categories/categories.route";
import collectionRouter from "./collections/collections.route";
import bannerRouter from "./marketing/banners.route";
import variantPresetRouter from "./variant-presets/variant-presets.route";

const router = Router();

const PRODUCT_ROUTE = "/products";
const CATEGORY_ROUTE = "/categories";
const COLLECTION_ROUTE = "/collections";
const BANNER_ROUTE = "/marketing/banners";
const VARIANT_PRESET_ROUTE = "/variant-dimension-presets";

router.use(PRODUCT_ROUTE, productRouter);
router.use(CATEGORY_ROUTE, categoryRouter);
router.use(COLLECTION_ROUTE, collectionRouter);
router.use(BANNER_ROUTE, bannerRouter);
router.use(VARIANT_PRESET_ROUTE, variantPresetRouter);

export default router;
