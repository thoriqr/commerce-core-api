import { ROUTES } from "@/constants/routes";
import { STORE_ROUTES } from "../store.constants";
import { bannerQueryParams } from "./banner.schema";

const BANNER_BASE = `${ROUTES.STORE}${STORE_ROUTES.BANNER}`;

export const storeBannerSwagger = {
  tags: [
    {
      name: "Store Banners",
      description: "Public banner data for storefront placements such as homepage hero sections"
    }
  ],

  paths: {
    [`${BANNER_BASE}`]: {
      get: {
        tags: ["Store Banners"],
        summary: "Get banners by placement",
        description: `
Retrieve active banners for a specific placement.

This endpoint is primarily used for displaying promotional banners on the storefront, such as homepage hero sections.

Note:
- Banners are filtered by placement.
- Currently supports homepage hero banners.
- The \`url\` field can be used for navigation (e.g. collection or product pages).
- Supports HTTP caching via ETag.
`,

        requestParams: {
          query: bannerQueryParams
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
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 1 },
                          title: {
                            type: "string",
                            example: "New Arrivals Collection"
                          },
                          imageKey: {
                            type: "string",
                            example: "banners/example-banner.webp"
                          },
                          url: {
                            type: "string",
                            example: "/collection/new-arrivals"
                          }
                        }
                      },
                      example: [
                        {
                          id: 1,
                          title: "New Arrivals Collection",
                          imageKey: "banners/example-banner.webp",
                          url: "/collection/new-arrivals"
                        },
                        {
                          id: 2,
                          title: "Summer Collection",
                          imageKey: "banners/example-banner-2.webp",
                          url: "/collection/summer-collection"
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
    }
  }
};
