import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { CheckoutUserController } from "./checkout.user.controller";
import { CheckoutUserService } from "./checkout.user.service";
import { ProductStockRepo } from "@/modules/product/product-stock.repo";
import { ProductImageRepo } from "@/modules/product/product-image.repo";
import { ProductImageService } from "@/modules/product/product-image.service";
import { UserRepo } from "../user.repo";
import { CheckoutRepo } from "@/modules/checkout/checkout.repo";
import { OrderUserRepo } from "../orders/order.user.repo";
import { CheckoutUserRepo } from "./checkout.user.repo";

const router = Router();

const tm = new KnexTransactionManager(db);

const userRepo = new UserRepo();

const orderUserRepo = new OrderUserRepo();

const checkoutUserRepo = new CheckoutUserRepo();
const checkoutRepo = new CheckoutRepo();

const productStockRepo = new ProductStockRepo();

const productImageRepo = new ProductImageRepo();
const productImageService = new ProductImageService(productImageRepo);

const checkoutUserService = new CheckoutUserService(
  tm,
  userRepo,
  orderUserRepo,
  checkoutUserRepo,
  checkoutRepo,
  productStockRepo,
  productImageService
);

const controller = new CheckoutUserController(checkoutUserService);

router.post("/:sessionId/confirm", controller.confirmCheckout);

export default router;
