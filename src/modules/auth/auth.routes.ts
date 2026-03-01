import { Router } from "express";
import { AuthRepo } from "./auth.repo";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { db } from "@/infra/db/knex";

const router = Router();

const tm = new KnexTransactionManager(db);
const repo = new AuthRepo();
const service = new AuthService(tm, repo);
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
