import { Router } from "express";
import { KnexTransactionManager } from "../../../infra/db/transaction-manager";
import { ProductController } from "./product.controller";
import { ProductRepo } from "./product.repo";
import { ProductService } from "./product.service";
import { db } from "../../../infra/db/knex";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new ProductRepo();
const service = new ProductService(tm, repo);
const controller = new ProductController(service);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:productId", controller.getById);
router.put("/:productId", controller.update);

export default router;
