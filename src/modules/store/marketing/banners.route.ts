import { Router } from "express";
import { BannerController } from "./banner.controller";
import { BannerRepo } from "./banner.repo";
import { BannerService } from "./banner.service";

const router = Router();

const repo = new BannerRepo();
const service = new BannerService(repo);
const controller = new BannerController(service);

router.get("/", controller.getBanners);

export default router;
