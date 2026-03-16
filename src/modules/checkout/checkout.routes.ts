import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { AuthRepo } from "../auth/auth.repo";
import { AuthService } from "../auth/auth.service";
import { createRequireAuth } from "@/middlewares/auth.middleware";
import { RajaOngkirClient } from "../shipping/rajaongkir.client";
import { db } from "@/infra/db/knex";
import { ShippingService } from "../shipping/shipping.service";
import { CheckoutRepo } from "./checkout.repo";
import { CheckoutService } from "./checkout.service";
import { CheckoutController } from "./checkout.controller";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const checkoutRepo = new CheckoutRepo();
const checkoutService = new CheckoutService(tm, checkoutRepo, shippingService);
const controller = new CheckoutController(checkoutService);

const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

router.post("/", requireAuth, controller.createCheckoutSession);

router.get("/:sessionId", requireAuth, controller.getCheckoutSession);

router.patch("/:sessionId/address", requireAuth, controller.setAddress);

router.post("/:sessionId/shipping-cost", requireAuth, controller.calculateShippingCost);

router.patch("/:sessionId/shipping-method", requireAuth, controller.setShippingMethod);

export default router;
