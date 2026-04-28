import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { successResponse } from "@/docs/swagger/helpers/success.helper";
import { createProductRequestSchema } from "./product.schema";
import { badRequestError, forbiddenError, serverError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";

const PRODUCT_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.PRODUCT}`;

export const productWriteErrors = {
  400: badRequestError("Invalid product data or business rule violation"),
  401: unauthorizedError(),
  403: forbiddenError("Admin access required"),
  500: serverError("Failed to process product request")
};

export const adminProductSwagger = {
  tags: [
    {
      name: "Admin Products",
      description: "Admin product management"
    }
  ],

  paths: {
    [`${PRODUCT_BASE}`]: {
      post: {
        tags: ["Admin Products"],
        summary: "Create product",
        description: `
Create a new product with images and variants.

This endpoint accepts **multipart/form-data**.

Note: The \`payload\` field must be sent as a JSON string.

Refer to the request body fields below for detailed structure and examples.
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
              schema: createProductRequestSchema
            }
          }
        },

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Product created"
                })
              }
            }
          },

          ...productWriteErrors
        }
      }
    }
  }
};
