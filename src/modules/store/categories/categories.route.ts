import { Router } from "express";
import { CategoryRepo } from "./category.repo";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";

const router = Router();

const repo = new CategoryRepo();
const service = new CategoryService(repo);
const controller = new CategoryController(service);

router.get("/mega-menu", controller.getMegaMenu);
router.get("/popular", controller.getPopular);
router.get("/detail", controller.getDetail);
router.get("/filters", controller.getFilters);

export default router;
