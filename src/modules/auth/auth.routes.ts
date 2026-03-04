import { Router } from "express";
import { AuthRepo } from "./auth.repo";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";
import { requireRole } from "@/middlewares/role.middleware";
import { createRequireAuth } from "@/middlewares/auth.middleware";

const router = Router();

const tm = new KnexTransactionManager(db);
const repo = new AuthRepo();
const service = new AuthService(tm, repo);
const controller = new AuthController(service);
const requireAuth = createRequireAuth(service);

router.post("/register", controller.register);
router.post("/verify-email", controller.verifyEmail);
router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.post("/request-password-reset", controller.requestPasswordReset);
router.post("/reset-password", controller.resetPassword);
router.post("/change-password", requireAuth, controller.changePassword);
router.post("/set-password", requireAuth, controller.setPassword);
router.post("/change-email", requireAuth, controller.changeEmail);
router.post("/confirm-email-change", controller.confirmEmailChange);

router.post("/google", controller.googleLogin);

router.get("/me", requireAuth, controller.me);

router.post("/invite", requireAuth, requireRole("SUPER"), controller.inviteAdmin);

export default router;
