import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { ProductImageRepo } from "../product/product-image.repo";
import { ProductImageService } from "../product/product-image.service";
import { OrderPaymentsRepo } from "./order-payments/order-payments.repo";
import { OrdersRepo } from "./orders.repo";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { AuthRepo } from "../auth/auth.repo";
import { AuthService } from "../auth/auth.service";
import { createRequireAuth } from "@/middlewares/auth.middleware";

const router = Router();

const tm = new KnexTransactionManager(db);

// auth
const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

// variant image
const imageRepo = new ProductImageRepo();
const imageService = new ProductImageService(imageRepo);

const paymentsRepo = new OrderPaymentsRepo();
const ordersRepo = new OrdersRepo();
const ordersService = new OrdersService(tm, ordersRepo, imageService, paymentsRepo);
const controller = new OrdersController(ordersService);

router.post("/checkout-sessions/:sessionId/confirm", requireAuth, controller.confirmCheckout);
router.post("/orders/:orderCode/snap-token", requireAuth, controller.createSnapToken);
router.post("/payments/midtrans/webhook", controller.handleMidtransWebhook);

export default router;
