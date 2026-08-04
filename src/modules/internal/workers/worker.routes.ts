import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { WorkerRepo } from "./worker.repo";
import { WorkerService } from "./worker.service";
import { WorkerController } from "./worker.controller";
import { requireWorker } from "./worker.middleware";

const router = Router();

const tm = new KnexTransactionManager(db);
const repo = new WorkerRepo();
const service = new WorkerService(tm, repo);
const controller = new WorkerController(service);

router.post("/run", requireWorker, controller.run);

export default router;
