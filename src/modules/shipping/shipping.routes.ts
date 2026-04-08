import { Router } from "express";
import { ShippingService } from "./shipping.service";
import { RajaOngkirClient } from "./rajaongkir.client";
import { ShippingController } from "./shipping.controller";
import { requireAuth } from "@/middlewares/auth.middleware";

const router = Router();

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);
const controller = new ShippingController(shippingService);

router.use(requireAuth);
router.get("/provinces", controller.getProvinces);
router.get("/cities/:provinceId", controller.getCities);
router.get("/districts/:cityId", controller.getDistricts);
router.post("/cost", controller.calculateDomesticCost);

export default router;
