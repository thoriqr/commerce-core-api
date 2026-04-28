import { authSwagger } from "@/modules/auth/auth.swagger";
import { env } from "../../config/env";
import { createDocument } from "zod-openapi";
import { API_PREFIX } from "@/constants/routes";
import { adminProductSwagger } from "@/modules/admin/product/product.swagger";
import { adminCategorySwagger } from "@/modules/admin/category/category.swagger";
import { adminCollectionSwagger } from "@/modules/admin/collection/collection.swagger";

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
    ...adminCollectionSwagger.paths
    // ...productSwagger.paths
  }
});
