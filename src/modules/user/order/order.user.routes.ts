import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { OrderUserService } from "./order.user.service";
import { OrderRepo } from "@/modules/order/order.repo";
import { OrderUserRepo } from "./order.user.repo";
import { OrderUserController } from "./order.user.controller";

const router = Router();

const tm = new KnexTransactionManager(db);

const orderRepo = new OrderRepo();
const orderUserRepo = new OrderUserRepo();

const orderUserService = new OrderUserService(tm, orderRepo, orderUserRepo);

const controller = new OrderUserController(orderUserService);

router.get("/", controller.getOrders);
router.get("/:orderCode", controller.getOrder);

router.post("/:orderCode/cancel", controller.cancelOrder);

router.post("/:orderCode/snap-token", controller.createSnapToken);

export default router;
