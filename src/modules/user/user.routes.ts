import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { UserRepo } from "./user.repo";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { ShippingService } from "../shipping/shipping.service";
import { RajaOngkirClient } from "../shipping/rajaongkir.client";
import orderUserRouter from "./order/order.user.routes";
import checkoutUserRouter from "./checkout/checkout.user.routes";
import { USER_ROUTES } from "./user.constants";
import { requireAuth } from "@/middlewares/auth.middleware";
import { actionLimiter } from "@/middlewares/rate-limit.middleware";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const userRepo = new UserRepo();
const userService = new UserService(tm, userRepo, shippingService);
const userController = new UserController(userService);

router.use(requireAuth);

router.get("/profile", userController.getUserProfile);
router.put("/profile", actionLimiter, requireAuth, userController.updateProfile);

router.get("/addresses", userController.getAddresses);
router.get("/addresses/:addressId", userController.getAddressDetail);

router.post("/addresses", userController.createAddress);
router.patch("/addresses/:addressId/default", actionLimiter, userController.setDefaultAddress);
router.put("/addresses/:addressId", actionLimiter, userController.updateAddress);
router.delete("/addresses/:addressId", actionLimiter, userController.deleteAddress);

router.use(USER_ROUTES.CHECKOUT, checkoutUserRouter);
router.use(USER_ROUTES.ORDERS, orderUserRouter);

export default router;
