import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { successResponse } from "@/docs/swagger/helpers/success.helper";
import { upsertProductRequestSchema, productIdParams, productResponseExample, updateProductStatusSchema, productQueryParams } from "./product.schema";
import { badRequestError, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { presetDimensionNameParams } from "../variant-preset/variant-preset.schema";

const PRODUCT_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.PRODUCT}`;

export const productWriteErrors = {
  400: badRequestError("Invalid product data or business rule violation"),
  401: unauthorizedError(),
  403: forbiddenError("Admin access required")
};

const optionItem = {
  type: "object",
  properties: {
    value: { type: "string" },
    label: { type: "string" }
  }
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
              schema: upsertProductRequestSchema
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
      },

      get: {
        tags: ["Admin Products"],
        summary: "Get products",
        description: `
Retrieve a paginated list of products with filtering and sorting.

This endpoint is used in the product listing page.

Supports:
- search (q)
- filtering (status, stock, price range, variant type)
- sorting
- pagination
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          query: productQueryParams
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
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          productId: { type: "number", example: 86 },
                          name: { type: "string", example: "Bag test" },
                          slug: { type: "string", example: "bag-test" },
                          thumbnailImage: {
                            type: "string",
                            example: "products/image.webp",
                            nullable: true
                          },
                          minPrice: { type: "number", example: 4000000 },
                          maxPrice: { type: "number", example: 4000000 },
                          activeMinPrice: { type: "number", nullable: true },
                          activeMaxPrice: { type: "number", nullable: true },
                          totalStock: { type: "number", example: 2 },
                          totalSold: { type: "number", example: 3 },
                          sku: { type: "string", example: "TEST-1" },
                          status: { type: "string", example: "ACTIVE" },
                          categoryName: { type: "string", example: "Men Clothes" },
                          isVariant: { type: "boolean", example: true },
                          variantCount: { type: "number", example: 3 },
                          createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2026-04-07T07:39:18.669Z"
                          }
                        }
                      }
                    },
                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 10 },
                        total: { type: "number", example: 11 },
                        totalPages: { type: "number", example: 2 },
                        hasNext: { type: "boolean", example: true },
                        hasPrev: { type: "boolean", example: false }
                      }
                    }
                  }
                }
              }
            }
          },

          400: badRequestError("Invalid query parameters"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    },
    [`${PRODUCT_BASE}/{productId}`]: {
      get: {
        tags: ["Admin Products"],
        summary: "Get product by ID",
        description: `
Retrieve a product by its ID.

The response includes product details, images, variants, and variant dimensions.

This endpoint supports both:
- Single product (no variants)
- Variant product (with dimensions and options)
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: productIdParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      example: productResponseExample
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Product not found")
        }
      },

      put: {
        tags: ["Admin Products"],
        summary: "Update product",
        description: `
Update an existing product with images and variants.

This endpoint accepts **multipart/form-data**.

Note: The \`payload\` field must be sent as a JSON string.

The payload structure is the same as create product. Existing data will be updated based on the provided payload.

Refer to the request body fields below for detailed structure and examples.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: productIdParams
        },

        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: upsertProductRequestSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Product updated"
                })
              }
            }
          },

          ...productWriteErrors,

          404: notFoundError("Product not found")
        }
      }
    },
    [`${PRODUCT_BASE}/actions/status`]: {
      patch: {
        tags: ["Admin Products"],
        summary: "Update product status (batch)",
        description: `
Update the status of multiple products in a single request.

Used for bulk actions in the product listing.
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
              schema: updateProductStatusSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Product status updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Some products not found")
        }
      }
    },

    [`${PRODUCT_BASE}/options/category`]: {
      get: {
        tags: ["Admin Products"],
        summary: "Get category options",
        description: `
Retrieve category options for product selection.

This endpoint is used in product create/update forms to populate category dropdowns.

Each option includes:
- \`value\`: category ID
- \`label\`: full category path (e.g. "Menswear / Men Clothes / Hoodies")
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
                      items: optionItem,
                      example: [
                        {
                          value: "60",
                          label: "Menswear"
                        },
                        {
                          value: "61",
                          label: "Menswear / Men Clothes"
                        },
                        {
                          value: "62",
                          label: "Menswear / Men Clothes / Men Hoodies"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    },
    [`${PRODUCT_BASE}/options/collection`]: {
      get: {
        tags: ["Admin Products"],
        summary: "Get collection options",
        description: `
Retrieve collection options for product selection.

This endpoint is used in product create/update forms to populate collection selectors.

Each option includes:
- \`value\`: collection ID
- \`label\`: collection name
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
                      items: optionItem,
                      example: [
                        {
                          value: "9",
                          label: "New Arrivals"
                        },
                        {
                          value: "6",
                          label: "Mid Summer Sale"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    },
    [`${PRODUCT_BASE}/options/dimension-preset`]: {
      get: {
        tags: ["Admin Products"],
        summary: "Get variant dimension presets",
        description: `
Retrieve predefined variant dimension presets.

This endpoint is used in product create/update forms to quickly select common dimensions (e.g. Color, Size).

Note:
- Presets are optional helpers.
- Custom dimensions can still be defined manually in the product payload.

Each option includes:
- \`value\`: preset ID
- \`label\`: dimension name
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
                      items: optionItem,
                      example: [
                        { value: "1", label: "Color" },
                        { value: "3", label: "Size" }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    },

    [`${PRODUCT_BASE}/options/dimension-preset/{dimensionPresetName}`]: {
      get: {
        tags: ["Admin Products"],
        summary: "Get dimension preset values",
        description: `
Retrieve available values for a specific dimension preset.

This endpoint is used in product create/update forms after selecting a dimension preset (e.g. Color → Red, Blue).

Note:
- Always returns 200.
- Returns an empty array if no values are found.

Each option may include:
- \`value\`: option ID
- \`label\`: option value (e.g. Red, Blue)
- \`hexColor\`: optional color representation
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: presetDimensionNameParams
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
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          value: {
                            type: "string",
                            example: "47"
                          },
                          label: {
                            type: "string",
                            example: "Red"
                          },
                          hexColor: {
                            type: "string",
                            example: "#ff0000",
                            nullable: true
                          }
                        }
                      },
                      example: [
                        {
                          value: "47",
                          label: "Red",
                          hexColor: "#ff0000"
                        },
                        {
                          value: "48",
                          label: "Blue",
                          hexColor: "#0000ff"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    }
  }
};
