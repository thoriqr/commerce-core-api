import { ROUTES } from "@/constants/routes";
import { badRequestError, forbiddenError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { successResponse } from "@/docs/swagger/helpers/success.helper";
import { upsertWarehousesSchema } from "./warehouse.schema";

const WAREHOUSE_BASE = `${ROUTES.WAREHOUSE}`;

export const warehouseSwagger = {
  tags: [
    {
      name: "Warehouse",
      description: "Warehouse and shipping origin configuration"
    }
  ],

  paths: {
    [`${WAREHOUSE_BASE}`]: {
      get: {
        tags: ["Warehouse"],
        summary: "Get warehouse",
        description: `
Retrieve warehouse configuration used as the default shipping origin.

Used for shipping cost calculation and delivery estimation.
Accessible by both admin and super users.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 1 },
                        name: {
                          type: "string",
                          example: "Main Warehouse"
                        },
                        shippingProvinceId: {
                          type: "number",
                          example: 18
                        },
                        shippingProvinceName: {
                          type: "string",
                          example: "JAWA TIMUR"
                        },
                        shippingCityId: {
                          type: "number",
                          example: 577
                        },
                        shippingCityName: {
                          type: "string",
                          example: "SURABAYA"
                        },
                        shippingDistrictId: {
                          type: "number",
                          example: 5874
                        },
                        shippingDistrictName: {
                          type: "string",
                          example: "BENOWO"
                        },
                        postalCode: {
                          type: "string",
                          example: "60195"
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin or super access required")
        }
      },

      put: {
        tags: ["Warehouse"],
        summary: "Save warehouse",
        description: `
Create or update the warehouse configuration.

This is a singleton resource, meaning only one warehouse is stored.
If a warehouse already exists, it will be updated. Otherwise, a new one will be created.

Used as the default shipping origin for all shipping calculations.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: upsertWarehousesSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Warehouse saved"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Super admin access required")
        }
      }
    }
  }
};
