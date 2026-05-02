import { ROUTES } from "@/constants/routes";
import { STORE_ROUTES } from "../store.constants";
import { notFoundError } from "@/docs/swagger/helpers/error.helper";
import {
  productByCategoryQueryParams,
  productByCollectionQueryParams,
  productBySearchQueryParams,
  productFilterQueryParams,
  productIdParams,
  productVariantIdParams
} from "./product.schema";

const PRODUCT_BASE = `${ROUTES.STORE}${STORE_ROUTES.PRODUCT}`;

export const storeProductSwagger = {
  tags: [
    {
      name: "Store Products",
      description: "Public product data for storefront browsing and product detail pages"
    }
  ],

  paths: {
    [`${PRODUCT_BASE}/{productId}`]: {
      get: {
        tags: ["Store Products"],
        summary: "Get product detail",
        description: `
Retrieve detailed information for a specific product.

This endpoint provides product metadata, variant structure, selectable dimensions, and associated images.

Note:

Supports both single-variant and multi-variant products.  
Dimensions are used to construct product option selectors (e.g. color, size).  
Images may be associated with product or variant combinations.  
Supports HTTP caching via ETag.

The \`warning\` field indicates product-level availability.

UNAVAILABLE indicates the product is not active.

This field may be \`null\` when the product is available and is intended for UI display purposes only.
`,

        requestParams: {
          path: productIdParams
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
                  example: "public, max-age=60, must-revalidate"
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
                        id: { type: "number", example: 78 },
                        name: { type: "string", example: "Basic T-Shirt" },
                        slug: { type: "string", example: "basic-t-shirt" },
                        description: {
                          type: "string",
                          example: "A comfortable everyday t-shirt."
                        },

                        isAvailable: { type: "boolean", example: true },
                        warning: {
                          type: "string",
                          nullable: true,
                          example: null
                        },

                        isVariant: { type: "boolean", example: true },
                        initialVariantId: {
                          type: "number",
                          example: 620
                        },

                        category: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              example: "Men T-Shirts"
                            },
                            slugPath: {
                              type: "string",
                              example: "menswear/men-clothes/men-t-shirts"
                            }
                          }
                        },

                        dimensions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              key: { type: "string", example: "color" },
                              label: {
                                type: "string",
                                example: "Color"
                              },
                              values: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    key: {
                                      type: "string",
                                      example: "black"
                                    },
                                    label: {
                                      type: "string",
                                      example: "Black"
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
                          }
                        },

                        variants: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number", example: 630 },
                              options: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    dimensionKey: {
                                      type: "string",
                                      example: "color"
                                    },
                                    valueKey: {
                                      type: "string",
                                      example: "black"
                                    }
                                  }
                                }
                              }
                            }
                          }
                        },

                        images: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number", example: 73 },
                              imageKey: {
                                type: "string",
                                example: "products/main-img.webp"
                              },
                              type: {
                                type: "string",
                                example: "product"
                              },
                              signature: {
                                type: "object",
                                nullable: true,
                                properties: {
                                  dimensionKey: {
                                    type: "string",
                                    example: "color"
                                  },
                                  valueKey: {
                                    type: "string",
                                    example: "black"
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          404: notFoundError("Product not found")
        }
      }
    },

    [`${PRODUCT_BASE}/{productId}/variants/{variantId}`]: {
      get: {
        tags: ["Store Products"],
        summary: "Get variant detail",
        description: `
Retrieve detailed information for a specific product variant.

This endpoint is used when switching product variants (e.g. selecting color or size) and returns updated pricing, stock, and availability.

Note:

Each variant may have different price, stock, and weight.  
Designed to be lightweight for fast UI updates when selecting options.  
Supports HTTP caching via ETag with a short cache duration.

The \`warning\` field provides availability hints for the selected variant.

UNAVAILABLE indicates the product or variant is not active.  
OUT_OF_STOCK indicates no stock is available.  
LOW_STOCK indicates limited stock remaining.

This field may be \`null\` when no warning applies and is intended for UI display purposes only.
`,

        requestParams: {
          path: productVariantIdParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "ETag for cache validation (If-None-Match)",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=10, must-revalidate"
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
                        variantId: { type: "number", example: 622 },
                        price: { type: "number", example: 40000 },
                        stock: { type: "number", example: 31 },
                        sku: {
                          type: "string",
                          nullable: true,
                          example: null
                        },
                        currency: {
                          type: "string",
                          example: "IDR"
                        },
                        weight: {
                          type: "number",
                          example: 300
                        },
                        weightUnit: {
                          type: "string",
                          example: "g"
                        },

                        isAvailable: {
                          type: "boolean",
                          example: true
                        },

                        warning: {
                          type: "string",
                          nullable: true,
                          enum: ["UNAVAILABLE", "OUT_OF_STOCK", "LOW_STOCK"],
                          example: null
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          404: notFoundError("Product or variant not found")
        }
      }
    },

    [`${PRODUCT_BASE}/filters`]: {
      get: {
        tags: ["Store Products"],
        summary: "Get search filters",
        description: `
Retrieve available filter options based on a search query.

This endpoint returns variant dimensions (e.g. color, size) along with available values and their matching product counts.

Note:

Filters are generated based on the provided search keyword.  
This endpoint does not return product listings.  
Intended to be used together with search result endpoints.  
Returns an empty array when no matching data is found.  
Supports HTTP caching via ETag.
`,

        requestParams: {
          query: productFilterQueryParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "ETag for cache validation (If-None-Match)",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=60, must-revalidate"
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
                                  example: 1
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
                              count: 1,
                              hexColor: "#000000"
                            },
                            {
                              value: "green",
                              label: "Green",
                              count: 1,
                              hexColor: "#00ff00"
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
                              value: "xl",
                              label: "XL",
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
          }
        }
      }
    },

    [`${PRODUCT_BASE}/by-search`]: {
      get: {
        tags: ["Store Products"],
        summary: "Search products",
        description: `
Retrieve products based on a search query with optional filters.

This endpoint supports cursor-based pagination and dynamic filtering.

Note:

Requires a search query via the \`q\` parameter.  
Supports additional filters such as variant options (e.g. color, size).  
Filters are handled dynamically and validated internally.  
Returns an empty array when no results are found.  
Uses cursor-based pagination with \`nextCursor\` and \`hasMore\`.  
Supports HTTP caching via ETag.
`,

        requestParams: {
          query: productBySearchQueryParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "ETag for cache validation (If-None-Match)",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=60, must-revalidate"
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
                          id: { type: "number", example: 78 },
                          name: {
                            type: "string",
                            example: "Basic T-Shirt"
                          },
                          slug: {
                            type: "string",
                            example: "basic-t-shirt"
                          },
                          imageKey: {
                            type: "string",
                            example: "products/example.webp"
                          },
                          displayPrice: {
                            type: "number",
                            example: 120000
                          }
                        }
                      },
                      example: [
                        {
                          id: 78,
                          name: "Basic T-Shirt",
                          slug: "basic-t-shirt",
                          imageKey: "products/example.webp",
                          displayPrice: 120000
                        }
                      ]
                    },

                    meta: {
                      type: "object",
                      properties: {
                        nextCursor: {
                          type: "string",
                          nullable: true,
                          example: "eyJpZCI6Nzh9"
                        },
                        hasMore: {
                          type: "boolean",
                          example: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    [`${PRODUCT_BASE}/by-collection`]: {
      get: {
        tags: ["Store Products"],
        summary: "Get products by collection",
        description: `
Retrieve products belonging to a specific collection.

This endpoint is typically used for collection pages and can be combined with collection detail endpoints for full page rendering.

Note:

Requires a valid collection slug via the \`slug\` parameter.  
Returns 404 if the collection does not exist.  
Supports cursor-based pagination using \`nextCursor\` and \`hasMore\`.  
Supports HTTP caching via ETag.
`,

        requestParams: {
          query: productByCollectionQueryParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "ETag for cache validation (If-None-Match)",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=60, must-revalidate"
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
                          id: { type: "number", example: 86 },
                          name: {
                            type: "string",
                            example: "Leather Travel Bag"
                          },
                          slug: {
                            type: "string",
                            example: "leather-travel-bag"
                          },
                          imageKey: {
                            type: "string",
                            example: "products/example.webp"
                          },
                          displayPrice: {
                            type: "number",
                            example: 400000
                          }
                        }
                      },
                      example: [
                        {
                          id: 86,
                          name: "Leather Travel Bag",
                          slug: "leather-travel-bag",
                          imageKey: "products/example.webp",
                          displayPrice: 400000
                        }
                      ]
                    },

                    meta: {
                      type: "object",
                      properties: {
                        nextCursor: {
                          type: "string",
                          nullable: true,
                          example: null
                        },
                        hasMore: {
                          type: "boolean",
                          example: false
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          404: notFoundError("Collection not found")
        }
      }
    },

    [`${PRODUCT_BASE}/by-category`]: {
      get: {
        tags: ["Store Products"],
        summary: "Get products by category",
        description: `
Retrieve products belonging to a specific category.

This endpoint supports cursor-based pagination and dynamic filtering, including variant-based filters such as color and size.

Note:

Requires a valid category slug path via the \`slugPath\` parameter.  
Returns 404 if the category does not exist.  
Supports additional filters such as variant options.  
Filters are handled dynamically and validated internally.  
Supports multi-value filters (e.g. color=black,green).  
Uses cursor-based pagination with \`nextCursor\` and \`hasMore\`.  
Supports HTTP caching via ETag.
`,

        requestParams: {
          query: productByCategoryQueryParams
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              ETag: {
                description: "ETag for cache validation (If-None-Match)",
                schema: {
                  type: "string",
                  example: '"abc123"'
                }
              },
              "Cache-Control": {
                description: "Cache control policy",
                schema: {
                  type: "string",
                  example: "public, max-age=60, must-revalidate"
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
                          id: { type: "number", example: 78 },
                          name: {
                            type: "string",
                            example: "Basic T-Shirt"
                          },
                          slug: {
                            type: "string",
                            example: "basic-t-shirt"
                          },
                          imageKey: {
                            type: "string",
                            example: "products/example.webp"
                          },
                          displayPrice: {
                            type: "number",
                            example: 120000
                          }
                        }
                      }
                    },

                    meta: {
                      type: "object",
                      properties: {
                        nextCursor: {
                          type: "string",
                          nullable: true,
                          example: null
                        },
                        hasMore: {
                          type: "boolean",
                          example: false
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
    }
  }
};
