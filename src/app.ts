import express from "express";
import cors from "cors";
import adminRouter from "./modules/admin/admin.routes";
import superRouter from "./modules/super/super.routes";
import storeRouter from "./modules/store/store.routes";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.routes";
import shippingRouter from "./modules/shipping/shipping.routes";
import paymentRouter from "./modules/payment/payment.routes";
import cartRouter from "./modules/cart/cart.routes";
import warehouseRouter from "./modules/warehouse/warehouse.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ROUTES } from "./constants/routes";
import { env } from "./config/env";
import cookieParser from "cookie-parser";
import { attachClient } from "./middlewares/attach-client.middleware";
import helmet from "helmet";
import { globalLimiter } from "./middlewares/rate-limit.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger/swagger";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.use(cookieParser());

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: [...env.CLIENT_ORIGINS, /^https:\/\/commerce-web-storefront.*\.vercel\.app$/],
    credentials: true
  })
);

app.use(globalLimiter);
app.use(attachClient);

app.get("/health", (_req, res) => {
  res.send("OK");
});

app.use(
  ROUTES.DOCS,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      supportedSubmitMethods: [], // disable "Try it out"
      tagsSorter: "alpha",
      operationsSorter: "method",
      docExpansion: "none"
    },
    customSiteTitle: "Commerce API Docs"
  })
);

app.use(ROUTES.STORE, storeRouter);
app.use(ROUTES.CART, cartRouter);
app.use(ROUTES.AUTH, authRouter);
app.use(ROUTES.USER, userRouter);
app.use(ROUTES.SHIPPING, shippingRouter);
app.use(ROUTES.PAYMENT, paymentRouter);
app.use(ROUTES.WAREHOUSE, warehouseRouter);
app.use(ROUTES.ADMIN, adminRouter);
app.use(ROUTES.SUPER, superRouter);

app.use(errorMiddleware);

export default app;
