import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { CheckoutUserController } from "./checkout.user.controller";
import { CheckoutUserService } from "./checkout.user.service";
import { ProductStockRepo } from "@/modules/product/product-stock.repo";
import { ProductImageRepo } from "@/modules/product/product-image.repo";
import { ProductImageService } from "@/modules/product/product-image.service";
import { UserRepo } from "../user.repo";
import { OrderUserRepo } from "../order/order.user.repo";
import { CheckoutUserRepo } from "./checkout.user.repo";
import { RajaOngkirClient } from "@/modules/shipping/rajaongkir.client";
import { ShippingService } from "@/modules/shipping/shipping.service";
import { actionLimiter } from "@/middlewares/rate-limit.middleware";
import { WarehouseRepo } from "@/modules/warehouse/warehouse.repo";
import { CartRepo } from "@/modules/cart/cart.repo";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const userRepo = new UserRepo();

const orderUserRepo = new OrderUserRepo();

const checkoutUserRepo = new CheckoutUserRepo();

const productStockRepo = new ProductStockRepo();

const productImageRepo = new ProductImageRepo();
const productImageService = new ProductImageService(productImageRepo);

const warehouseRepo = new WarehouseRepo();

const cartRepo = new CartRepo();

const checkoutUserService = new CheckoutUserService(
  tm,
  userRepo,
  orderUserRepo,
  checkoutUserRepo,
  shippingService,
  productStockRepo,
  productImageService,
  warehouseRepo,
  cartRepo
);

const controller = new CheckoutUserController(checkoutUserService);

router.post("/", actionLimiter, controller.createCheckoutSession);

router.get("/origin", controller.getWarehouseOrigin);

router.get("/:sessionId", controller.getCheckoutSession);

router.patch("/:sessionId/address", actionLimiter, controller.setAddress);

router.post("/:sessionId/shipping-cost", actionLimiter, controller.calculateShippingCost);

router.patch("/:sessionId/shipping-method", actionLimiter, controller.setShippingMethod);

router.post("/:sessionId/confirm", actionLimiter, controller.confirmCheckout);

export default router;
