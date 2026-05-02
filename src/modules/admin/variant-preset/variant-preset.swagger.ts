import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { badRequestError, conflictError, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { successResponse } from "@/docs/swagger/helpers/success.helper";
import { presetDimensionIdParams, presetDimensionUpsertSchema } from "./variant-preset.schema";

const VARIANT_PRESET_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.VARIANT_PRESET}`;

export const adminVariantPresetSwagger = {
  tags: [
    {
      name: "Admin Variant Presets",
      description: "Admin variant preset management"
    }
  ],

  paths: {
    [`${VARIANT_PRESET_BASE}`]: {
      get: {
        tags: ["Admin Variant Presets"],
        summary: "Get variant presets",
        description: `
Retrieve a list of variant presets.

These presets are used to quickly populate variant dimensions (e.g. Color, Size)
when creating or updating products, without defining them manually.
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
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 1 },
                          name: { type: "string", example: "Color" },
                          valuesCount: {
                            type: "number",
                            example: 7,
                            description: "Total number of available values in this preset"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      },

      post: {
        tags: ["Admin Variant Presets"],
        summary: "Create variant preset",
        description: `
Create a new variant preset.

A preset consists of a dimension name (e.g. Color, Size) and its predefined values.

Note:  

The dimension name must be unique.  
Values can be duplicated across presets and are not required to be unique.
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
              schema: presetDimensionUpsertSchema
            }
          }
        },

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Preset dimension created"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          409: conflictError("Preset dimension already exists")
        }
      }
    },

    [`${VARIANT_PRESET_BASE}/{dimensionPresetId}`]: {
      get: {
        tags: ["Admin Variant Presets"],
        summary: "Get variant preset by ID",
        description: `
Retrieve a variant preset by its ID.

The response includes the dimension name and its associated values.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: presetDimensionIdParams
        },

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
                        name: { type: "string", example: "Color" },
                        values: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", example: "47" },
                              name: { type: "string", example: "Red" },
                              hexColor: {
                                type: "string",
                                example: "#ff0000"
                              }
                            }
                          },
                          example: [
                            {
                              id: "47",
                              name: "Red",
                              hexColor: "#ff0000"
                            },
                            {
                              id: "48",
                              name: "Green",
                              hexColor: "#00ff00"
                            },
                            {
                              id: "49",
                              name: "Blue",
                              hexColor: "#0000ff"
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Preset dimension not found")
        }
      },

      put: {
        tags: ["Admin Variant Presets"],
        summary: "Update variant preset",
        description: `
Update an existing variant preset.

All fields follow the same structure as create preset.  
Existing values will be updated based on the provided input.

Note:  

The dimension name must remain unique.  
Values can be duplicated and are not required to be unique.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: presetDimensionIdParams
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: presetDimensionUpsertSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Preset dimension updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Preset dimension not found"),
          409: conflictError("Preset dimension already exists")
        }
      },

      delete: {
        tags: ["Admin Variant Presets"],
        summary: "Delete variant preset",
        description: `
Delete a variant preset by its ID.

Note:  

This operation removes the preset along with all its values.  
This does not affect any existing products that previously used this preset.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: presetDimensionIdParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Preset dimension removed"
                })
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Preset dimension not found")
        }
      }
    }
  }
};
