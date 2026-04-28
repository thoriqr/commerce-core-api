import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { badRequestError, conflictError, errorResponse, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { collectionIdParams, collectionReorderSchema, collectionUpsertSchema } from "./collection.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const COLLECTION_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.COLLECTION}`;

export const adminCollectionSwagger = {
  tags: [
    {
      name: "Admin Collections",
      description: "Admin collection management"
    }
  ],

  paths: {
    [`${COLLECTION_BASE}`]: {
      get: {
        tags: ["Admin Collections"],
        summary: "Get collections",
        description: `
Retrieve all collections.

This endpoint returns a flat list of collections along with the number of products in each collection.

Used for:
- selecting collections when assigning products
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
                          id: { type: "number", example: 9 },
                          name: { type: "string", example: "New Arrivals" },
                          slug: { type: "string", example: "new-arrivals" },
                          status: { type: "string", example: "ACTIVE" },
                          sortOrder: { type: "number", example: 10 },
                          productCount: {
                            type: "number",
                            example: 7,
                            description: "Number of products assigned to this collection"
                          }
                        }
                      },
                      example: [
                        {
                          id: 9,
                          name: "New Arrivals",
                          slug: "new-arrivals",
                          status: "ACTIVE",
                          sortOrder: 10,
                          productCount: 7
                        },
                        {
                          id: 6,
                          name: "Mid Summer Sale",
                          slug: "mid-summer-sale",
                          status: "ACTIVE",
                          sortOrder: 20,
                          productCount: 7
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
      },

      post: {
        tags: ["Admin Collections"],
        summary: "Create collection",
        description: `
Create a new collection.

Collections are used to group products (e.g. promotions, seasonal items).

Note:
- The \`slug\` must be unique.
- If a duplicate slug is detected, the system will automatically generate a unique slug (e.g. "menswear-2").
- This endpoint will not return a conflict error for duplicate slugs.
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
              schema: collectionUpsertSchema
            }
          }
        },

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Collection created"
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

    [`${COLLECTION_BASE}/{collectionId}`]: {
      get: {
        tags: ["Admin Collections"],
        summary: "Get collection by ID",
        description: `
Retrieve a single collection by its ID.

Returns collection details.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: collectionIdParams
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
                        id: { type: "number", example: 6 },
                        name: { type: "string", example: "Mid Summer Sale" },
                        description: {
                          type: "string",
                          nullable: true,
                          example: ""
                        },
                        status: { type: "string", example: "ACTIVE" },
                        slug: { type: "string", example: "mid-summer-sale" },
                        sortOrder: { type: "number", example: 20 }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Collection not found")
        }
      },
      put: {
        tags: ["Admin Collections"],
        summary: "Update collection",
        description: `
Update an existing collection.

This endpoint updates collection details such as name, slug, description, and status.

Note:
- The \`slug\` must be unique.
- If the provided slug conflicts with another collection, a unique slug will be automatically generated.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: collectionIdParams
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: collectionUpsertSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Collection updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Collection not found")
        }
      },
      delete: {
        tags: ["Admin Collections"],
        summary: "Delete collection",
        description: `
Delete a collection by its ID.

Note:
- A collection cannot be deleted if it is still used by other resources (e.g. marketing banners).
- This validation is handled at the application level.

Make sure the collection is not referenced before deleting.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: collectionIdParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Collection removed"
                })
              }
            }
          },

          400: errorResponse({
            code: "BAD_REQUEST",
            message: "Collection is still used by a banner",
            description: "The collection cannot be deleted because it is currently referenced by a marketing banner"
          }),

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Collection not found")
        }
      }
    },
    [`${COLLECTION_BASE}/actions/reorder`]: {
      put: {
        tags: ["Admin Collections"],
        summary: "Reorder collections",
        description: `
Reorder collections.

This endpoint is typically used for drag-and-drop sorting in the admin UI.

Note:
- This operation updates only the \`sortOrder\` field.
- The request is processed in batch.
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
              schema: collectionReorderSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Collection reordered"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required")
        }
      }
    }
  }
};
