import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { Router } from "express";
import userSuperRouter from "./user/user.super.routes";
import { SUPER_ROUTES } from "./super.constants";
import { blockDemoWrite } from "@/middlewares/block-demo-write.middleware";

const router = Router();

router.use(requireAuth, requireRole("SUPER"), blockDemoWrite);

router.use(SUPER_ROUTES.USER, userSuperRouter);

export default router;
