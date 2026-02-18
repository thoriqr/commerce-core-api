import { Router } from "express";
import { ProductRepo } from "./product.repo";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";

const router = Router();

const repo = new ProductRepo();
const service = new ProductService(repo);
const controller = new ProductController(service);

router.get("/by-category", controller.getByCategory);

export default router;
