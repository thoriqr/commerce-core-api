import { Router } from "express";
import { ShippingService } from "./shipping.service";
import { RajaOngkirClient } from "./rajaongkir.client";
import { ShippingController } from "./shipping.controller";

const router = Router();

const rajaOngkirClient = new RajaOngkirClient();
const shippingService = new ShippingService(rajaOngkirClient);
const controller = new ShippingController(shippingService);

router.get("/provinces", controller.getProvinces);
router.get("/cities/:provinceId", controller.getCities);
router.get("/districts/:cityId", controller.getDistricts);

export default router;
