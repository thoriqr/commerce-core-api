import { Router } from "express";
import productRouter from "./products/products.route";

const router = Router();

const PRODUCT_ROUTE = "/products";

router.use(PRODUCT_ROUTE, productRouter);

export default router;
