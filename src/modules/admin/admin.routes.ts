import { Router } from "express";
import productRouter from "./product/product.routes";
import categoryRouter from "./category/category.routes";
import collectionRouter from "./collection/collection.routes";
import bannerRouter from "./marketing/banner.routes";
import variantPresetRouter from "./variant-preset/variant-preset.routes";
import warehousesRouter from "./warehouse/warehouse.routes";
import dashboardRouter from "./dashboard/dashboard.routes";
import orderRouter from "./order/order.routes";
import { ADMIN_ROUTES } from "./admin.constants";
import { requireRole } from "@/middlewares/role.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "SUPER"));

router.use(ADMIN_ROUTES.PRODUCT, productRouter);
router.use(ADMIN_ROUTES.CATEGORY, categoryRouter);
router.use(ADMIN_ROUTES.COLLECTION, collectionRouter);
router.use(ADMIN_ROUTES.BANNER, bannerRouter);
router.use(ADMIN_ROUTES.VARIANT_PRESET, variantPresetRouter);
router.use(ADMIN_ROUTES.WAREHOUSE, warehousesRouter);
router.use(ADMIN_ROUTES.DASHBOARD, dashboardRouter);
router.use(ADMIN_ROUTES.ORDER, orderRouter);

export default router;
