import { Router } from "express";
import bannerRouter from "./marketing/banners.route";
import categoryRouter from "./categories/categories.route";
import productRouter from "./products/products.route";
import collectionRouter from "./collections/collections.route";
import cartRouter from "./cart/cart.route";

const router = Router();

const PRODUCT_ROUTE = "/products";
const CATEGORY_ROUTE = "/categories";
const BANNER_ROUTE = "/marketing/banners";
const COLLECTION_ROUTE = "/collections";
const CART_ROUTE = "/cart";

router.use(BANNER_ROUTE, bannerRouter);
router.use(CATEGORY_ROUTE, categoryRouter);
router.use(COLLECTION_ROUTE, collectionRouter);
router.use(PRODUCT_ROUTE, productRouter);
router.use(CART_ROUTE, cartRouter);

export default router;
