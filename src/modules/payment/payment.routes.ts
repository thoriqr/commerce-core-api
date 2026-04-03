import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { ProductMetricsRepo } from "../product/product-metrics.repo";
import { PaymentRepo } from "./payment.repo";
import { OrderRepo } from "../orders/order.repo";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

const router = Router();

const tm = new KnexTransactionManager(db);

const paymentsRepo = new PaymentRepo();
const orderRepo = new OrderRepo();
const productMetricsRepo = new ProductMetricsRepo();

const paymentService = new PaymentService(tm, orderRepo, paymentsRepo, productMetricsRepo);

const controller = new PaymentController(paymentService);

router.post("/midtrans/webhook", controller.handleMidtransWebhook);

export default router;
