import { ROUTES } from "@/constants/routes";
import { badRequestError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { calculateDomesticCostSchema, getCitiesParamsSchema, getDistrictsParamsSchema } from "./shipping.schema";

const SHIPPING_BASE = `${ROUTES.SHIPPING}`;

export const shippingSwagger = {
  tags: [
    {
      name: "Shipping",
      description: "Shipping location data and cost calculation for address selection and checkout"
    }
  ],

  paths: {
    [`${SHIPPING_BASE}/provinces`]: {
      get: {
        tags: ["Shipping"],
        summary: "Get provinces",
        description: `
Retrieve a list of available provinces for shipping.

Used when creating or updating addresses or configuring the warehouse location.
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
                          id: {
                            type: "number",
                            example: 15
                          },
                          name: {
                            type: "string",
                            example: "BALI"
                          }
                        }
                      },
                      example: [
                        { id: 15, name: "BALI" },
                        { id: 24, name: "BANGKA BELITUNG" },
                        { id: 9, name: "DKI JAKARTA" }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError()
        }
      }
    },

    [`${SHIPPING_BASE}/cities/{provinceId}`]: {
      get: {
        tags: ["Shipping"],
        summary: "Get cities by province",
        description: `
Retrieve a list of cities for a given province.

Used when selecting address or warehouse location.

Note:  

Returns an empty array if no cities are found.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: getCitiesParamsSchema
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
                          id: {
                            type: "number",
                            example: 580
                          },
                          name: {
                            type: "string",
                            example: "BANGKALAN"
                          }
                        }
                      },
                      example: [
                        { id: 580, name: "BANGKALAN" },
                        { id: 257, name: "BANYUWANGI" },
                        { id: 393, name: "BATU" }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError()
        }
      }
    },

    [`${SHIPPING_BASE}/districts/{cityId}`]: {
      get: {
        tags: ["Shipping"],
        summary: "Get districts by city",
        description: `
Retrieve a list of districts for a given city.

Used when selecting address or warehouse location.

Note:  

Returns an empty array if no districts are found.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: getDistrictsParamsSchema
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
                          id: {
                            type: "number",
                            example: 5873
                          },
                          name: {
                            type: "string",
                            example: "ASEMROWO"
                          }
                        }
                      },
                      example: [
                        { id: 5873, name: "ASEMROWO" },
                        { id: 5874, name: "BENOWO" },
                        { id: 5875, name: "BUBUTAN" }
                      ]
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError()
        }
      }
    },

    [`${SHIPPING_BASE}/cost`]: {
      post: {
        tags: ["Shipping"],
        summary: "Calculate shipping cost",
        description: `
Calculate domestic shipping cost based on destination, weight, and courier.

This endpoint is typically used during checkout to estimate shipping cost before placing an order.
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
              schema: calculateDomesticCostSchema
            }
          }
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
                          name: {
                            type: "string",
                            example: "Jalur Nugraha Ekakurir (JNE)"
                          },
                          code: {
                            type: "string",
                            example: "jne"
                          },
                          service: {
                            type: "string",
                            example: "REG"
                          },
                          description: {
                            type: "string",
                            example: "Layanan Reguler"
                          },
                          cost: {
                            type: "number",
                            example: 60000
                          },
                          etd: {
                            type: "string",
                            example: "5 day"
                          }
                        }
                      },
                      example: [
                        {
                          name: "Jalur Nugraha Ekakurir (JNE)",
                          code: "jne",
                          service: "REG",
                          description: "Layanan Reguler",
                          cost: 60000,
                          etd: "5 day"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError()
        }
      }
    }
  }
};
