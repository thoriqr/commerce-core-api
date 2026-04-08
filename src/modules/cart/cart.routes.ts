import { Router } from "express";
import { CartRepo } from "./cart.repo";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";
import { optionalAuth } from "@/middlewares/auth.middleware";
import { ProductImageRepo } from "@/modules/product/product-image.repo";
import { ProductImageService } from "@/modules/product/product-image.service";

const router = Router();

const tm = new KnexTransactionManager(db);

// variant image
const imageRepo = new ProductImageRepo();
const imageService = new ProductImageService(imageRepo);

// Cart
const cartRepo = new CartRepo();
const cartService = new CartService(tm, cartRepo, imageService);
const cartController = new CartController(cartService);

router.use(optionalAuth);
router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:variantId", cartController.updateItem);
router.delete("/items/:variantId", cartController.deleteItem);

export default router;
