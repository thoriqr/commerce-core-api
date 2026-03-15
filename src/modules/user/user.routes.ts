import { db } from "@/infra/db/knex";
import { KnexTransactionManager } from "@/infra/db/transaction-manager";
import { Router } from "express";
import { UserRepo } from "./user.repo";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { createRequireAuth } from "@/middlewares/auth.middleware";
import { AuthRepo } from "../auth/auth.repo";
import { AuthService } from "../auth/auth.service";

const router = Router();

const tm = new KnexTransactionManager(db);
const userRepo = new UserRepo();
const userService = new UserService(tm, userRepo);
const controller = new UserController(userService);

const authRepo = new AuthRepo();
const authService = new AuthService(tm, authRepo);

const requireAuth = createRequireAuth(authService);

export default router;
