import { authSwagger } from "@/modules/auth/auth.swagger";
import { env } from "../../config/env";
import { createDocument } from "zod-openapi";
import { API_PREFIX } from "@/constants/routes";
import { adminProductSwagger } from "@/modules/admin/product/product.swagger";
import { adminCategorySwagger } from "@/modules/admin/category/category.swagger";
import { adminCollectionSwagger } from "@/modules/admin/collection/collection.swagger";
import { adminBannerSwagger } from "@/modules/admin/marketing/banner.swagger";
import { adminVariantPresetSwagger } from "@/modules/admin/variant-preset/variant-preset.swagger";
import { adminOrderSwagger } from "@/modules/admin/order/order.swagger";
import { adminDashboardSwagger } from "@/modules/admin/dashboard/dashboard.swagger";
import { adminUserSwagger } from "@/modules/admin/user/user.admin.swagger";
import { superUserSwagger } from "@/modules/super/user/user.super.swagger";
import { warehouseSwagger } from "@/modules/warehouse/warehouse.swagger";
import { shippingSwagger } from "@/modules/shipping/shipping.swagger";
import { paymentSwagger } from "@/modules/payment/payment.swagger";

export const swaggerSpec = createDocument({
  openapi: "3.1.0",

  info: {
    title: "Commerce API",
    version: "1.0.0",
    description: "API documentation for Commerce backend"
  },

  servers: [
    {
      url: `${env.API_URL}${API_PREFIX}`
    }
  ],

  tags: [
    ...authSwagger.tags,
    ...adminProductSwagger.tags,
    ...adminCategorySwagger.tags,
    ...adminCollectionSwagger.tags,
    ...adminBannerSwagger.tags,
    ...adminVariantPresetSwagger.tags,
    ...adminOrderSwagger.tags,
    ...adminUserSwagger.tags,
    ...adminDashboardSwagger.tags,
    ...superUserSwagger.tags,
    ...warehouseSwagger.tags,
    ...shippingSwagger.tags,
    ...paymentSwagger.tags
  ],

  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token"
      }
    }
  },

  paths: {
    ...authSwagger.paths,
    ...adminProductSwagger.paths,
    ...adminCategorySwagger.paths,
    ...adminCollectionSwagger.paths,
    ...adminBannerSwagger.paths,
    ...adminVariantPresetSwagger.paths,
    ...adminOrderSwagger.paths,
    ...adminDashboardSwagger.paths,
    ...adminUserSwagger.paths,
    ...superUserSwagger.paths,
    ...warehouseSwagger.paths,
    ...shippingSwagger.paths,
    ...paymentSwagger.paths
  }
});
