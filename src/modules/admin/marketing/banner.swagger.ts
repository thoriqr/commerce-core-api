import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { bannerIdParams, bannerUpsertRequestSchema } from "./banner.schema";
import { badRequestError, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const BANNER_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.BANNER}`;

export const adminBannerSwagger = {
  tags: [
    {
      name: "Admin Banners",
      description: "Admin banner management"
    }
  ],

  paths: {
    [`${BANNER_BASE}`]: {
      post: {
        tags: ["Admin Banners"],
        summary: "Create banner",
        description: `
Create a new banner.

This endpoint accepts **multipart/form-data** with image upload and metadata fields.

Refer to the request body for field details and examples.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: bannerUpsertRequestSchema
            }
          }
        },

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Banner created"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    },

    [`${BANNER_BASE}/{bannerId}`]: {
      put: {
        tags: ["Admin Banners"],
        summary: "Update banner",
        description: `
Update an existing banner.

This endpoint accepts **multipart/form-data** with image upload and metadata fields.

All fields follow the same structure as create banner.
Existing data will be updated based on the provided input.

If no new image file is provided, the existing image will be retained.

Refer to the request body for field details and examples.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: bannerIdParams
        },

        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: bannerUpsertRequestSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Banner updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Banner not found")
        }
      }
    }
  }
};
