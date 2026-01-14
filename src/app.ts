import express from "express";
import adminRouter from "./modules/admin/admin.route";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.use("/admin", adminRouter);

app.use(errorMiddleware);

export default app;
