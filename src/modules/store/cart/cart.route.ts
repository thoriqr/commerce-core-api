import { Router } from "express";
import { CartRepo } from "./cart.repo";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";
import { AuthRepo } from "@/modules/auth/auth.repo";
import { AuthService } from "@/modules/auth/auth.service";
import { createOptionalAuth } from "@/middlewares/auth.middleware";

const router = Router();

const tm = new KnexTransactionManager(db);

// Cart
const cartRepo = new CartRepo();
const cartService = new CartService(tm, cartRepo);
const cartController = new CartController(cartService);

// AUTH (for optionalAuth)
const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const optionalAuth = createOptionalAuth(authService);

router.get("/", optionalAuth, cartController.getCart);
router.post("/items", optionalAuth, cartController.addItem);
router.patch("/items/:variantId", optionalAuth, cartController.updateItem);
router.delete("/items/:variantId", optionalAuth, cartController.deleteItem);

export default router;
