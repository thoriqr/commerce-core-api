import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { UserRepo } from "./user.repo";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { createRequireAuth } from "@/middlewares/auth.middleware";
import { AuthRepo } from "../auth/auth.repo";
import { AuthService } from "../auth/auth.service";
import { ShippingService } from "../shipping/shipping.service";
import { RajaOngkirClient } from "../shipping/rajaongkir.client";
import { OrderRepo } from "../orders/order.repo";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const userRepo = new UserRepo();
const orderRepo = new OrderRepo();
const userService = new UserService(tm, userRepo, orderRepo, shippingService);
const controller = new UserController(userService);

const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

router.get("/profile", requireAuth, controller.getUserProfile);
router.put("/profile", requireAuth, controller.updateProfile);

router.get("/orders", requireAuth, controller.getOrders);
router.get("/addresses", requireAuth, controller.getAddresses);

router.get("/addresses/:addressId", requireAuth, controller.getAddressDetail);

router.post("/addresses", requireAuth, controller.createAddress);

router.patch("/addresses/:addressId/default", requireAuth, controller.setDefaultAddress);

router.put("/addresses/:addressId", requireAuth, controller.updateAddress);

router.delete("/addresses/:addressId", requireAuth, controller.deleteAddress);

export default router;
