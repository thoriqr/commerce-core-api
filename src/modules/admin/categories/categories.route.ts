import { Router } from "express";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { CategoryRepo } from "./category.repo";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { db } from "@/infra/db/knex";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new CategoryRepo();
const service = new CategoryService(tm, repo);
const controller = new CategoryController(service);

router.post("/", controller.create);

export default router;
