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
import orderUserRouter from "./orders/order.user.routes";
import checkoutUserRouter from "./checkout/checkout.user.routes";
import { USER_ROUTES } from "./user.constants";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const userRepo = new UserRepo();
const userService = new UserService(tm, userRepo, shippingService);
const userController = new UserController(userService);

const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

router.use(requireAuth);

router.get("/profile", userController.getUserProfile);
router.put("/profile", requireAuth, userController.updateProfile);

router.get("/addresses", userController.getAddresses);
router.get("/addresses/:addressId", userController.getAddressDetail);

router.post("/addresses", userController.createAddress);
router.patch("/addresses/:addressId/default", userController.setDefaultAddress);
router.put("/addresses/:addressId", userController.updateAddress);
router.delete("/addresses/:addressId", userController.deleteAddress);

router.use(USER_ROUTES.CHECKOUT, checkoutUserRouter);
router.use(USER_ROUTES.ORDERS, orderUserRouter);

export default router;
