import { Router } from "express";
import productRouter from "./products/products.route";
import categoryRouter from "./categories/categories.route";
import collectionRouter from "./collections/collections.route";
import bannerRouter from "./marketing/banners.route";
import variantPresetRouter from "./variant-presets/variant-presets.route";
import warehousesRouter from "./warehouses/warehouses.route";
import dashboardRouter from "./dashboard/dashboard.route";
import orderRouter from "./orders/order.routes";

const router = Router();

const PRODUCT_ROUTE = "/products";
const CATEGORY_ROUTE = "/categories";
const COLLECTION_ROUTE = "/collections";
const BANNER_ROUTE = "/marketing/banners";
const VARIANT_PRESET_ROUTE = "/variant-dimension-presets";
const WAREHOUSE_ROUTE = "/warehouse";
const DASHBOARD_ROUTE = "/dashboard";
const ORDER_ROUTE = "/orders";

router.use(PRODUCT_ROUTE, productRouter);
router.use(CATEGORY_ROUTE, categoryRouter);
router.use(COLLECTION_ROUTE, collectionRouter);
router.use(BANNER_ROUTE, bannerRouter);
router.use(VARIANT_PRESET_ROUTE, variantPresetRouter);
router.use(WAREHOUSE_ROUTE, warehousesRouter);
router.use(DASHBOARD_ROUTE, dashboardRouter);
router.use(ORDER_ROUTE, orderRouter);

export default router;
