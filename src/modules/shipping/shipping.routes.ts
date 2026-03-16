import { Router } from "express";
import { ShippingService } from "./shipping.service";
import { RajaOngkirClient } from "./rajaongkir.client";
import { ShippingController } from "./shipping.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { AuthRepo } from "../auth/auth.repo";
import { AuthService } from "../auth/auth.service";
import { createRequireAuth } from "@/middlewares/auth.middleware";
import { db } from "@/infra/db/knex";

const router = Router();

const tm = new KnexTransactionManager(db);

const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);
const controller = new ShippingController(shippingService);

router.get("/provinces", requireAuth, controller.getProvinces);
router.get("/cities/:provinceId", requireAuth, controller.getCities);
router.get("/districts/:cityId", requireAuth, controller.getDistricts);
router.post("/cost", requireAuth, controller.calculateDomesticCost);

export default router;
