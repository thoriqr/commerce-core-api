import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { CollectionRepo } from "./collection.repo";
import { CollectionService } from "./collection.service";
import { CollectionController } from "./collection.controller";
import { db } from "@/infra/db/knex";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new CollectionRepo();
const service = new CollectionService(tm, repo);
const controller = new CollectionController(service);

router.get("/", controller.getAll);
router.post("/", controller.create);
router.get("/:collectionId", controller.getById);
router.put("/:collectionId", controller.update);
router.put("/actions/reorder", controller.reorderCollection);
router.delete("/:collectionId", controller.remove);

export default router;
