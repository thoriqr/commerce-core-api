import express from "express";
import cors from "cors";
import adminRouter from "./modules/admin/admin.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ADMIN_PREFIX } from "./constants/routes";
import { env } from "./config/env";

const app = express();

const origins = env.CLIENT_ORIGINS.split(",").map((o) => o.trim());

app.use(express.json());

app.use(
  cors({
    origin: origins,
    credentials: true
  })
);

app.use(ADMIN_PREFIX, adminRouter);

app.use(errorMiddleware);

export default app;
