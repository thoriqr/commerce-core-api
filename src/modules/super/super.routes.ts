import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { Router } from "express";
import userSuperRouter from "./user/user.super.routes";
import { SUPER_ROUTES } from "./super.constants";

const router = Router();

router.use(requireAuth, requireRole("SUPER"));

router.use(SUPER_ROUTES.USER, userSuperRouter);

export default router;
