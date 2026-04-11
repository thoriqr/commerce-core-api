import { Router } from "express";
import { UserAdminRepo } from "./user.admin.repo";
import { UserAdminService } from "./user.admin.service";
import { UserAdminController } from "./user.admin.controller";

const router = Router();

const repo = new UserAdminRepo();
const service = new UserAdminService(repo);
const controller = new UserAdminController(service);

router.get("/", controller.getUsers);

export default router;
