import { ROUTES } from "@/constants/routes";
import { STORE_ROUTES } from "../store.constants";
import { notFoundError } from "@/docs/swagger/helpers/error.helper";
import { collectionSlugParams } from "./collection.schema";

const COLLECTION_BASE = `${ROUTES.STORE}${STORE_ROUTES.COLLECTION}`;

export const storeCollectionSwagger = {
  tags: [
    {
      name: "Store Collections",
      description: "Public collection data for storefront sections such as homepage previews and featured listings"
    }
  ],

  paths: {
    [`${COLLECTION_BASE}/preview`]: {
      get: {
        tags: ["Store Collections"],
        summary: "Get collections preview",
        description: `
Retrieve a list of collections with a limited set of product previews.

This endpoint is primarily used for storefront sections such as the homepage, where collections are displayed with a small subset of products.

Note:  

Each collection includes a limited number of products (controlled internally).  
This endpoint is optimized for display purposes and not intended for full product listing.  
The \`hasMoreProducts\` flag indicates whether more products are available in the collection.  
Supports HTTP caching via ETag.
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
                          id: { type: "number", example: 1 },
                          name: {
                            type: "string",
                            example: "New Arrivals"
                          },
                          slug: {
                            type: "string",
                            example: "new-arrivals"
                          },
                          hasMoreProducts: {
                            type: "boolean",
                            example: true
                          },

                          products: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "number", example: 10 },
                                name: {
                                  type: "string",
                                  example: "Basic Backpack"
                                },
                                slug: {
                                  type: "string",
                                  example: "basic-backpack"
                                },
                                imageKey: {
                                  type: "string",
                                  example: "products/example.webp"
                                },
                                displayPrice: {
                                  type: "number",
                                  example: 250000
                                }
                              }
                            }
                          }
                        }
                      },
                      example: [
                        {
                          id: 1,
                          name: "New Arrivals",
                          slug: "new-arrivals",
                          hasMoreProducts: false,
                          products: [
                            {
                              id: 10,
                              name: "Basic Backpack",
                              slug: "basic-backpack",
                              imageKey: "products/example.webp",
                              displayPrice: 250000
                            },
                            {
                              id: 11,
                              name: "Classic T-Shirt",
                              slug: "classic-t-shirt",
                              imageKey: "products/example-shirt.webp",
                              displayPrice: 120000
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

    [`${COLLECTION_BASE}/{slug}`]: {
      get: {
        tags: ["Store Collections"],
        summary: "Get collection detail",
        description: `
Retrieve detailed information for a specific collection.

This endpoint provides basic collection metadata such as name and description.  

Note:  

This endpoint does not return product listings.  
Intended to be used together with collection product endpoints.  
Description may be a fallback value if not explicitly defined.  
Supports HTTP caching via ETag.
`,

        requestParams: {
          path: collectionSlugParams
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
                        id: { type: "number", example: 1 },
                        name: {
                          type: "string",
                          example: "New Arrivals"
                        },
                        slug: {
                          type: "string",
                          example: "new-arrivals"
                        },
                        description: {
                          type: "string",
                          example: "Explore our latest collection featuring newly added products."
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
    }
  }
};
