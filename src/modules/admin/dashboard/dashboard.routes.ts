import { Router } from "express";
import { DashboardRepo } from "./dashboard.repo";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";

const router = Router();

const repo = new DashboardRepo();
const service = new DashboardService(repo);
const controller = new DashboardController(service);

router.get("/", controller.getDashboard);

export default router;
