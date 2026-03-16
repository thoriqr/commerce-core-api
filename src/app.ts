import express from "express";
import cors from "cors";
import adminRouter from "./modules/admin/admin.route";
import storeRouter from "./modules/store/store.route";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.routes";
import shippingRouter from "./modules/shipping/shipping.routes";
import checkoutRouter from "./modules/checkout/checkout.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ADMIN_PREFIX, AUTH_PREFIX, SHIPPING_PREFIX, STORE_PREFIX, CHECKOUT_SESSION_PREFIX, USER_PREFIX } from "./constants/routes";
import { env } from "./config/env";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true
  })
);

app.use(STORE_PREFIX, storeRouter);
app.use(AUTH_PREFIX, authRouter);
app.use(USER_PREFIX, userRouter);
app.use(SHIPPING_PREFIX, shippingRouter);
app.use(CHECKOUT_SESSION_PREFIX, checkoutRouter);
app.use(ADMIN_PREFIX, adminRouter);

app.use(errorMiddleware);

export default app;
