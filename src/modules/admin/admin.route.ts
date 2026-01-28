import { Router } from "express";
import productRouter from "./products/products.route";
import categoryRouter from "./categories/categories.route";

const router = Router();

const PRODUCT_ROUTE = "/products";
const CATEGORY_ROUTE = "/categories";

router.use(PRODUCT_ROUTE, productRouter);
router.use(CATEGORY_ROUTE, categoryRouter);

export default router;
