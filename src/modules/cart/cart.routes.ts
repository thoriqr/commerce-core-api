import { Router } from "express";
import { CartRepo } from "./cart.repo";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import {  requireAuth } from "@/middlewares/auth.middleware";
import { ProductImageRepo } from "@/modules/product/product-image.repo";
import { ProductImageService } from "@/modules/product/product-image.service";
import { actionLimiter } from "@/middlewares/rate-limit.middleware";

const router = Router();

// variant image
const imageRepo = new ProductImageRepo();
const imageService = new ProductImageService(imageRepo);

// Cart
const cartRepo = new CartRepo();
const cartService = new CartService(cartRepo, imageService);
const cartController = new CartController(cartService);

router.use(requireAuth);
router.get("/", cartController.getCart);
router.post("/items", actionLimiter, cartController.addItem);
router.patch("/items/:variantId", actionLimiter, cartController.updateItem);
router.delete("/items/:variantId", actionLimiter, cartController.deleteItem);

export default router;
