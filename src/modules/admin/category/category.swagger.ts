import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import {
  categoryChildExample,
  categoryIdParams,
  categoryParentIdParams,
  categoryReorderSchema,
  categoryUpdateSchema,
  categoryUpsertExample,
  categoryUpsertSchema
} from "./category.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";
import { badRequestError, conflictError, errorResponse, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";

const CATEGORY_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.CATEGORY}`;

export const adminCategorySwagger = {
  tags: [
    {
      name: "Admin Categories",
      description: "Admin category management"
    }
  ],

  paths: {
    [`${CATEGORY_BASE}`]: {
      get: {
        tags: ["Admin Categories"],
        summary: "Get parent categories",
        description: `
Retrieve all parent (root) categories.

This endpoint returns only categories with no parent (parentId = null).

Used for:
- category listing (top-level)
- selecting parent when creating a new category

Note:
- This endpoint does not return child categories
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
                          id: { type: "number", example: 60 },
                          parentId: {
                            type: "number",
                            nullable: true,
                            example: null
                          },
                          name: { type: "string", example: "Menswear" },
                          slug: { type: "string", example: "menswear" },
                          sortOrder: { type: "number", example: 0 },
                          status: { type: "string", example: "ACTIVE" }
                        }
                      },
                      example: [
                        {
                          id: 60,
                          parentId: null,
                          name: "Menswear",
                          slug: "menswear",
                          sortOrder: 0,
                          status: "ACTIVE"
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
        tags: ["Admin Categories"],
        summary: "Create category",
        description: `
Create a new category.

This endpoint supports:
- Root category (set \`parentId\` to null)
- Child category (set \`parentId\` to an existing category ID)

Note:
- Categories are not recursive in this API.
- Each category belongs to a single parent (or none for root).
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
              schema: categoryUpsertSchema,
              examples: {
                root: {
                  summary: "Create root category",
                  value: categoryUpsertExample
                },
                child: {
                  summary: "Create child category",
                  value: categoryChildExample
                }
              }
            }
          }
        },

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Category created"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          409: conflictError("Category already exists")
        }
      }
    },
    [`${CATEGORY_BASE}/{categoryId}`]: {
      get: {
        tags: ["Admin Categories"],
        summary: "Get category by ID",
        description: `
Retrieve a single category by its ID.

Returns basic category information including parent reference.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: categoryIdParams
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
                        id: { type: "number", example: 95 },
                        parentId: { type: "number", nullable: true, example: null },
                        name: { type: "string", example: "Menswear" },
                        slug: { type: "string", example: "menswear" },
                        description: {
                          type: "string",
                          nullable: true,
                          example: null
                        },
                        sortOrder: { type: "number", example: 2 },
                        status: { type: "string", example: "ACTIVE" }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Category not found")
        }
      },
      put: {
        tags: ["Admin Categories"],
        summary: "Update category",
        description: `
Update an existing category.

This endpoint updates category details such as name, slug, description, and status.

`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: categoryIdParams
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: categoryUpdateSchema,
              example: {
                name: "Men Hoodies",
                slug: "men-hoodies",
                description: "Updated hoodies category",
                status: "ACTIVE"
              }
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Category updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Category not found")
        }
      },
      delete: {
        tags: ["Admin Categories"],
        summary: "Delete category",
        description: `
Delete a category by its ID.

A category can only be deleted if it has no dependencies.

Deletion will fail if the category:
- is assigned to any products
- has child categories (acts as a parent)

Ensure all references are removed or reassigned before deletion.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: categoryIdParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Category removed"
                })
              }
            }
          },

          400: errorResponse({
            code: "INVALID_REFERENCE",
            message: "Category cannot be deleted due to existing references",
            description:
              "The category is still referenced by other resources (e.g. products) or has child categories. Remove or reassign all dependencies before deleting."
          }),

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Category not found")
        }
      }
    },
    [`${CATEGORY_BASE}/{parentId}/tree`]: {
      get: {
        tags: ["Admin Categories"],
        summary: "Get category tree",
        description: `
Retrieve a category along with all its descendant categories (tree structure).

This endpoint returns a nested structure using the \`children\` field recursively.

Used for:
- category hierarchy display
- tree view UI
- nested category selection

Note:
- The response always includes the requested parent as the root node.
- Each category may contain a \`children\` array.
- Leaf nodes will have an empty \`children\` array.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: categoryParentIdParams
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
                        id: { type: "number", example: 60 },
                        parentId: { type: "number", nullable: true, example: null },
                        name: { type: "string", example: "Menswear" },
                        slug: { type: "string", example: "menswear" },
                        status: { type: "string", example: "ACTIVE" },
                        sortOrder: { type: "number", example: 0 },
                        children: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number" },
                              parentId: { type: "number", nullable: true },
                              name: { type: "string" },
                              slug: { type: "string" },
                              status: { type: "string" },
                              sortOrder: { type: "number" },
                              children: {
                                type: "array",
                                items: {
                                  type: "object" // recursive hint (Swagger limitation)
                                }
                              }
                            }
                          }
                        }
                      },
                      example: {
                        id: 60,
                        parentId: null,
                        name: "Menswear",
                        slug: "menswear",
                        status: "ACTIVE",
                        sortOrder: 0,
                        children: [
                          {
                            id: 61,
                            parentId: 60,
                            name: "Men Clothes",
                            slug: "men-clothes",
                            status: "ACTIVE",
                            sortOrder: 10,
                            children: [
                              {
                                id: 62,
                                parentId: 61,
                                name: "Men Hoodies",
                                slug: "men-hoodies",
                                status: "ACTIVE",
                                sortOrder: 20,
                                children: []
                              }
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Category not found")
        }
      }
    },

    [`${CATEGORY_BASE}/{parentId}/reorder`]: {
      put: {
        tags: ["Admin Categories"],
        summary: "Reorder categories",
        description: `
Reorder categories within the same parent.

This endpoint is typically used for drag-and-drop reordering in the UI.

Note:
- All categories must belong to the specified parent.
- Only \`sortOrder\` will be updated.
- This operation is applied in batch.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: categoryParentIdParams
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: categoryReorderSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Category reordered"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Category not found")
        }
      }
    }
  }
};
