import { Router } from "express";
import { AuthRepo } from "./auth.repo";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

const router = Router();

const repo = new AuthRepo();
const service = new AuthService(repo);
const controller = new AuthController(service);

router.post("/register", controller.register);
router.post("/verify-email", controller.verifyEmail);
router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.post("/request-password-reset", controller.requestPasswordReset);
router.post("/reset-password", controller.resetPassword);
router.post("/google", controller.googleLogin);
router.get("/me", controller.me);

export default router;
