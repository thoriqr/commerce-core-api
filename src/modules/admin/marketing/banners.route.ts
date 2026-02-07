import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { BannerRepo } from "./banner.repo";
import { BannerService } from "./banner.service";
import { BannerController } from "./banner.controller";
import { withMulter } from "@/middlewares/multer.middleware";
import { bannerImageUpload } from "./banner.upload";
import { UPLOAD_FILE } from "./banner.constants";

const router = Router();

const tm = new KnexTransactionManager(db);

const repo = new BannerRepo();
const service = new BannerService(tm, repo);
const controller = new BannerController(service);

router.get("/meta", controller.getOptions);
router.post("/", withMulter(bannerImageUpload.single(UPLOAD_FILE.BANNER_FIELD)), controller.create);
router.put("/:bannerId", controller.update);

export default router;
