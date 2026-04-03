import { Router } from "express";
import { WarehouseRepo } from "./warehouse.repo";
import { WarehouseService } from "./warehouse.service";
import { WarehouseController } from "./warehouse.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";
import { RajaOngkirClient } from "@/modules/shipping/rajaongkir.client";
import { ShippingService } from "@/modules/shipping/shipping.service";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const repo = new WarehouseRepo();
const service = new WarehouseService(tm, repo, shippingService);
const controller = new WarehouseController(service);

router.get("/", controller.getWarehouse);
router.put("/", controller.upsertWarehouse);

export default router;
