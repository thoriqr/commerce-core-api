import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { OrderAdminRepo } from "./order.admin.repo";
import { OrderRepo } from "@/modules/order/order.repo";

const router = Router();

const tm = new KnexTransactionManager(db);

const orderRepo = new OrderRepo();
const orderAdminRepo = new OrderAdminRepo();
const service = new OrderService(tm, orderRepo, orderAdminRepo);
const controller = new OrderController(service);

router.get("/", controller.getOrders);
router.get("/:orderId", controller.getOrder);
router.post("/:orderId/ship", controller.markAsShipped);
// router.post("/:orderId/deliver", controller.markAsDelivered);

export default router;
