import { Router } from "express";
import { WarehousesRepo } from "./warehouses.repo";
import { WarehousesService } from "./warehouses.service";
import { WarehousesController } from "./warehouses.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";
import { RajaOngkirClient } from "@/modules/shipping/rajaongkir.client";
import { ShippingService } from "@/modules/shipping/shipping.service";

const router = Router();

const tm = new KnexTransactionManager(db);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);

const repo = new WarehousesRepo();
const service = new WarehousesService(tm, repo, shippingService);
const controller = new WarehousesController(service);

router.get("/", controller.getWarehouse);
router.put("/", controller.upsertWarehouse);

export default router;
