import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { VariantPresetRepo } from "./variant-preset.repo";
import { VariantPresetService } from "./variant-preset.service";
import { VariantPresetController } from "./variant-preset.controller";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new VariantPresetRepo();
const service = new VariantPresetService(tm, repo);
const controller = new VariantPresetController(service);

router.get("/", controller.getAll);
router.post("/", controller.create);

router.get("/:dimensionPresetId", controller.getById);
router.put("/:dimensionPresetId", controller.update);
router.delete("/:dimensionPresetId", controller.remove);
router.put("/actions/reorder", controller.reorderDimensionValues);

export default router;
