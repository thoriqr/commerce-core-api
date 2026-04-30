import { ROUTES } from "@/constants/routes";
import { STORE_ROUTES } from "../store.constants";
import { categorySlugPathQueryParams } from "./category.schema";
import { notFoundError } from "@/docs/swagger/helpers/error.helper";

const CATEGORY_BASE = `${ROUTES.STORE}${STORE_ROUTES.CATEGORY}`;

export const storeCategorySwagger = {
  tags: [
    {
      name: "Store Categories",
      description: "Public category data for storefront navigation and browsing"
    }
  ],

  paths: {
    [`${CATEGORY_BASE}/mega-menu`]: {
      get: {
        tags: ["Store Categories"],
        summary: "Get category tree (mega menu)",
        description: `
Retrieve hierarchical category data for storefront navigation (mega menu).

This endpoint returns categories in a nested tree structure.

Caching:
- This endpoint supports HTTP caching via ETag.
- Clients may use the \`If-None-Match\` header to receive a 304 response when data has not changed.
- Some frameworks may handle caching independently.
`,

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "Entity tag for cache validation",
                schema: {
                  type: "string",
                  example: 'W/"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=300, must-revalidate"
                }
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 1 },
                          parentId: { type: "number", nullable: true, example: null },
                          name: { type: "string", example: "Menswear" },
                          slug: { type: "string", example: "menswear" },
                          slugPath: {
                            type: "string",
                            example: "menswear"
                          },
                          children: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "number", example: 2 },
                                parentId: { type: "number", example: 1 },
                                name: { type: "string", example: "Men Clothes" },
                                slug: {
                                  type: "string",
                                  example: "men-clothes"
                                },
                                slugPath: {
                                  type: "string",
                                  example: "menswear/men-clothes"
                                },
                                children: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    properties: {
                                      id: { type: "number", example: 3 },
                                      parentId: { type: "number", example: 2 },
                                      name: {
                                        type: "string",
                                        example: "Men T-Shirts"
                                      },
                                      slug: {
                                        type: "string",
                                        example: "men-t-shirts"
                                      },
                                      slugPath: {
                                        type: "string",
                                        example: "menswear/men-clothes/men-t-shirts"
                                      },
                                      children: {
                                        type: "array",
                                        example: []
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      example: [
                        {
                          id: 1,
                          parentId: null,
                          name: "Menswear",
                          slug: "menswear",
                          slugPath: "menswear",
                          children: [
                            {
                              id: 2,
                              parentId: 1,
                              name: "Men Clothes",
                              slug: "men-clothes",
                              slugPath: "menswear/men-clothes",
                              children: [
                                {
                                  id: 3,
                                  parentId: 2,
                                  name: "Men T-Shirts",
                                  slug: "men-t-shirts",
                                  slugPath: "menswear/men-clothes/men-t-shirts",
                                  children: []
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          304: {
            description: "Not Modified (ETag matched)"
          }
        }
      }
    },

    [`${CATEGORY_BASE}/popular`]: {
      get: {
        tags: ["Store Categories"],
        summary: "Get popular categories",
        description: `
Retrieve a list of popular categories based on sales.

Categories are ranked by total sold items.

Note:
- Categories with zero sales may still appear as fallback results.
- Supports HTTP caching via ETag.
`,

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "Entity tag for cache validation",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=300, must-revalidate"
                }
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },

                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 65 },
                          name: {
                            type: "string",
                            example: "Men T-Shirts"
                          },
                          slug: {
                            type: "string",
                            example: "men-t-shirts"
                          },
                          slugPath: {
                            type: "string",
                            example: "menswear/men-clothes/men-t-shirts"
                          },
                          totalSold: {
                            type: "number",
                            example: 128
                          }
                        }
                      },
                      example: [
                        {
                          id: 65,
                          name: "Men T-Shirts",
                          slug: "men-t-shirts",
                          slugPath: "menswear/men-clothes/men-t-shirts",
                          totalSold: 128
                        },
                        {
                          id: 73,
                          name: "Men Casual Shoes",
                          slug: "men-casual-shoes",
                          slugPath: "menswear/men-shoes/men-casual-shoes",
                          totalSold: 30
                        },
                        {
                          id: 63,
                          name: "Men Jackets",
                          slug: "men-jackets",
                          slugPath: "menswear/men-clothes/men-jackets",
                          totalSold: 11
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          304: {
            description: "Not Modified (ETag matched)"
          }
        }
      }
    },

    [`${CATEGORY_BASE}/detail`]: {
      get: {
        tags: ["Store Categories"],
        summary: "Get category detail",
        description: `
Retrieve detailed information for a category based on its slug path.

This endpoint provides category metadata, breadcrumb navigation, and direct child categories.

Note:
- This endpoint does not return product listings.
- Intended to be used together with category product endpoints.
- Category description may be a fallback value if not explicitly defined.
- Supports HTTP caching via ETag.
`,

        requestParams: {
          query: categorySlugPathQueryParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "Entity tag for cache validation",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=300, must-revalidate"
                }
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },

                    data: {
                      type: "object",
                      properties: {
                        category: {
                          type: "object",
                          properties: {
                            id: { type: "number", example: 1 },
                            name: {
                              type: "string",
                              example: "Menswear"
                            },
                            description: {
                              type: "string",
                              example: "Explore a wide range of menswear including new arrivals and best sellers."
                            },
                            slug: {
                              type: "string",
                              example: "menswear"
                            },
                            slugPath: {
                              type: "string",
                              example: "menswear"
                            }
                          }
                        },

                        breadcrumb: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number", example: 1 },
                              name: {
                                type: "string",
                                example: "Menswear"
                              },
                              slugPath: {
                                type: "string",
                                example: "menswear"
                              }
                            }
                          },
                          example: [
                            {
                              id: 1,
                              name: "Menswear",
                              slugPath: "menswear"
                            }
                          ]
                        },

                        children: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number", example: 2 },
                              name: {
                                type: "string",
                                example: "Men Clothes"
                              },
                              slugPath: {
                                type: "string",
                                example: "menswear/men-clothes"
                              }
                            }
                          },
                          example: [
                            {
                              id: 2,
                              name: "Men Clothes",
                              slugPath: "menswear/men-clothes"
                            },
                            {
                              id: 3,
                              name: "Men Shoes",
                              slugPath: "menswear/men-shoes"
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

          404: notFoundError("Category not found")
        }
      }
    },

    [`${CATEGORY_BASE}/filters`]: {
      get: {
        tags: ["Store Categories"],
        summary: "Get category filters",
        description: `
Retrieve available filter options for a category based on its slug path.

This endpoint returns variant dimensions (e.g. color, size) along with their available values and product counts.

Note:
- This endpoint does not return product listings.
- Intended to be used together with category product endpoints.
- Filter values include a count indicating how many products match each option.
- Supports HTTP caching via ETag.
`,

        requestParams: {
          query: categorySlugPathQueryParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "Entity tag for cache validation",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=300, must-revalidate"
                }
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },

                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                            example: "color"
                          },
                          label: {
                            type: "string",
                            example: "Color"
                          },
                          values: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                value: {
                                  type: "string",
                                  example: "black"
                                },
                                label: {
                                  type: "string",
                                  example: "Black"
                                },
                                count: {
                                  type: "number",
                                  example: 2
                                },
                                hexColor: {
                                  type: "string",
                                  nullable: true,
                                  example: "#000000"
                                }
                              }
                            }
                          }
                        }
                      },
                      example: [
                        {
                          name: "color",
                          label: "Color",
                          values: [
                            {
                              value: "black",
                              label: "Black",
                              count: 2,
                              hexColor: "#000000"
                            },
                            {
                              value: "blue",
                              label: "Blue",
                              count: 2,
                              hexColor: "#0000ff"
                            }
                          ]
                        },
                        {
                          name: "size",
                          label: "Size",
                          values: [
                            {
                              value: "m",
                              label: "M",
                              count: 1,
                              hexColor: null
                            },
                            {
                              value: "l",
                              label: "L",
                              count: 1,
                              hexColor: null
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          404: notFoundError("Category not found")
        }
      }
    }
  }
};
