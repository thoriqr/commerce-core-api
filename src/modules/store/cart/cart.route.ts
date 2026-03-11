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

// Cart
const cartRepo = new CartRepo();
const cartService = new CartService(cartRepo);
const cartController = new CartController(cartService);

// AUTH (for optionalAuth)
const tm = new KnexTransactionManager(db);
const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const optionalAuth = createOptionalAuth(authService);

router.get("/", optionalAuth, cartController.getCart);

export default router;
