import { Router } from "express";
import { AuthRepo } from "./auth.repo";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";
import { requireRole } from "@/middlewares/role.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { authLimiter, refreshLimiter } from "@/middlewares/rate-limit.middleware";

const router = Router();

const tm = new KnexTransactionManager(db);
const repo = new AuthRepo();
const service = new AuthService(tm, repo);
const controller = new AuthController(service);

router.post("/register", authLimiter, controller.register);
router.post("/check-verification-token", authLimiter, controller.checkVerificationToken);
router.post("/verify-email", authLimiter, controller.verifyEmail);

router.post("/login", authLimiter, controller.login);
router.post("/refresh", refreshLimiter, controller.refresh);
router.post("/logout", controller.logout);

router.post("/request-password-reset", authLimiter, controller.requestPasswordReset);
router.post("/reset-password", controller.resetPassword);

router.post("/change-password", requireAuth, controller.changePassword);
router.post("/set-password", requireAuth, controller.setPassword);

router.post("/google", authLimiter, controller.googleLogin);

router.get("/me", requireAuth, controller.me);

router.post("/invite", requireAuth, requireRole("SUPER"), controller.inviteAdmin);

router.get("/invite/validate/:token", authLimiter, controller.validateInviteAdmin);
router.post("/invite/accept", authLimiter, controller.acceptAdminInvite);

// TODO: enable when change email flow is finalized
// router.post("/change-email", requireAuth, controller.changeEmail);
// router.post("/confirm-email-change", controller.confirmEmailChange);

export default router;
