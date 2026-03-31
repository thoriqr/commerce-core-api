import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { ProductImageRepo } from "../product/product-image.repo";
import { ProductImageService } from "../product/product-image.service";
import { OrderPaymentsRepo } from "./order-payments/order-payments.repo";
import { OrderRepo } from "./order.repo";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { AuthRepo } from "../auth/auth.repo";
import { AuthService } from "../auth/auth.service";
import { createRequireAuth } from "@/middlewares/auth.middleware";
import { UserRepo } from "../user/user.repo";
import { ProductStockRepo } from "../product/product-stock.repo";
import { CheckoutRepo } from "../checkout/checkout.repo";
import { ProductMetricsRepo } from "../product/product-metrics.repo";

const router = Router();

const tm = new KnexTransactionManager(db);

// auth
const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

// variant image
const imageRepo = new ProductImageRepo();
const imageService = new ProductImageService(imageRepo);

const userRepo = new UserRepo();
const checkoutRepo = new CheckoutRepo();
const productStockRepo = new ProductStockRepo();
const productMetricsRepo = new ProductMetricsRepo();

const paymentsRepo = new OrderPaymentsRepo();

const orderRepo = new OrderRepo();
const orderService = new OrderService(tm, orderRepo, checkoutRepo, imageService, paymentsRepo, productStockRepo, productMetricsRepo, userRepo);
const controller = new OrderController(orderService);

router.post("/checkout-sessions/:sessionId/confirm", requireAuth, controller.confirmCheckout);
router.post("/orders/:orderCode/snap-token", requireAuth, controller.createSnapToken);
router.post("/orders/:orderCode/cancel", requireAuth, controller.cancelOrder);
router.get("/orders/:orderCode", requireAuth, controller.getOrder);
router.post("/payments/midtrans/webhook", controller.handleMidtransWebhook);

export default router;
