import { Router } from "express";
import { UserSuperRepo } from "./user.super.repo";
import { UserSuperService } from "./user.super.service";
import { UserSuperController } from "./user.super.controller";
import { actionLimiter } from "@/middlewares/rate-limit.middleware";

const router = Router();

const repo = new UserSuperRepo();
const service = new UserSuperService(repo);
const controller = new UserSuperController(service);

router.get("/", controller.getUsers);
router.post("/:userId/revoke-sessions", actionLimiter, controller.revokeUserSessions);

export default router;
