import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { OrderRepo } from "./order.repo";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new OrderRepo();
const service = new OrderService(tm, repo);
const controller = new OrderController(service);

router.get("/", controller.getOrders);
router.get("/:orderId", controller.getOrder);
router.post("/:orderId/ship", controller.markAsShipped);
router.post("/:orderId/deliver", controller.markAsDelivered);

export default router;
