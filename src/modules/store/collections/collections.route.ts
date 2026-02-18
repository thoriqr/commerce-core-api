import { Router } from "express";
import { CollectionRepo } from "./collection.repo";
import { CollectionService } from "./collection.service";
import { CollectionController } from "./collection.controller";

const router = Router();

const repo = new CollectionRepo();
const service = new CollectionService(repo);
const controller = new CollectionController(service);

router.get("/preview", controller.getCollectionsPreview);
router.get("/:slug", controller.getCollectionDetail);

export default router;
