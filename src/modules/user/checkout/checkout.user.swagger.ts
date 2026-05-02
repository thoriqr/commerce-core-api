import { ROUTES } from "@/constants/routes";
import { USER_ROUTES } from "../user.constants";
import { badRequestError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { calculateShippingSchema, checkoutSessionParamsSchema, setCheckoutAddressSchema, setShippingMethodSchema } from "./checkout.user.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const CHECKOUT_BASE = `${ROUTES.USER}${USER_ROUTES.CHECKOUT}`;

export const userCheckoutSwagger = {
  tags: [
    {
      name: "User Checkout",
      description: "Checkout process for placing orders"
    }
  ],
  paths: {
    [`${CHECKOUT_BASE}`]: {
      post: {
        tags: ["User Checkout"],
        summary: "Create checkout session",
        description: `
Create a new checkout session from the current user's cart.

This endpoint initializes the checkout process by capturing the current cart state.  

Note:  

The checkout session prepares order data such as items, address, and shipping.  
Payment is handled separately during the order process.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        sessionId: {
                          type: "number",
                          example: 101
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: badRequestError("Cart is empty"),
          401: unauthorizedError()
        }
      }
    },

    [`${CHECKOUT_BASE}/origin`]: {
      get: {
        tags: ["User Checkout"],
        summary: "Get warehouse origin",
        description: `
Retrieve the warehouse origin information used for shipping.

This is typically displayed during checkout to inform users where the order will be shipped from.
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
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          example: "Main Warehouse"
                        },
                        province: {
                          type: "string",
                          example: "JAWA TIMUR"
                        },
                        city: {
                          type: "string",
                          example: "SURABAYA"
                        },
                        district: {
                          type: "string",
                          example: "TEGALSARI"
                        }
                      }
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

    [`${CHECKOUT_BASE}/{sessionId}`]: {
      get: {
        tags: ["User Checkout"],
        summary: "Get checkout session",
        description: `
Retrieve a checkout session with its current state.

This endpoint returns all information required to complete checkout, including items, address, and shipping selection.  

Note:  

The session must be active (not expired, revoked, or completed).  
The response includes a \`canPlaceOrder\` flag and \`reason\` to indicate whether the order can be placed.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: checkoutSessionParamsSchema
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
                      properties: {
                        sessionId: { type: "number", example: 101 },
                        expiresAt: {
                          type: "string",
                          example: "2026-05-01T10:00:00.000Z"
                        },
                        subtotal: { type: "number", example: 250000 },
                        shippingCost: { type: "number", example: 0 },
                        total: { type: "number", example: 0 },
                        totalWeight: { type: "number", example: 1000 },

                        address: {
                          type: "object",
                          nullable: true,
                          properties: {
                            id: { type: "number", example: 1 },
                            recipientName: { type: "string", example: "John Doe" },
                            phone: { type: "string", example: "081234567890" },
                            addressLine: {
                              type: "string",
                              example: "Jl. Contoh No. 123"
                            },
                            provinceName: {
                              type: "string",
                              example: "JAWA TIMUR"
                            },
                            cityName: {
                              type: "string",
                              example: "SURABAYA"
                            },
                            districtName: {
                              type: "string",
                              example: "TEGALSARI"
                            },
                            postalCode: {
                              type: "string",
                              example: "60262"
                            }
                          }
                        },

                        courierCode: { type: "string", nullable: true, example: null },
                        courierName: { type: "string", nullable: true, example: null },
                        courierService: { type: "string", nullable: true, example: null },
                        shippingEtd: { type: "string", nullable: true, example: null },

                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              variantId: { type: "number", example: 101 },
                              productId: { type: "number", example: 10 },
                              productName: { type: "string", example: "Basic Backpack" },
                              imageKey: {
                                type: "string",
                                example: "products/example.webp"
                              },
                              slug: { type: "string", example: "basic-backpack" },
                              price: { type: "number", example: 250000 },
                              quantity: { type: "number", example: 1 },
                              stock: { type: "number", example: 2 },
                              weight: { type: "number", example: 1000 },
                              options: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    value: { type: "string", example: "Black" },
                                    dimension: { type: "string", example: "Color" }
                                  }
                                }
                              },
                              isAvailable: { type: "boolean", example: true },
                              warning: { type: "string", nullable: true, example: null }
                            }
                          }
                        },

                        canPlaceOrder: { type: "boolean", example: false },
                        reason: {
                          type: "string",
                          enum: ["INVALID_ITEMS", "NO_ADDRESS", "NO_SHIPPING", "SHIPPING_NOT_CALCULATED"],
                          nullable: true,
                          description: `
Indicates why the order cannot be placed.

Possible values:
- INVALID_ITEMS → One or more items are unavailable or have insufficient stock
- NO_ADDRESS → No shipping address selected
- NO_SHIPPING → Shipping method not selected
- SHIPPING_NOT_CALCULATED → Shipping cost has not been calculated

When null, the checkout session is ready to place an order.
`,
                          example: "NO_SHIPPING"
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          400: badRequestError("Checkout session is not active"),
          401: unauthorizedError(),
          404: notFoundError("Checkout session not found")
        }
      }
    },

    [`${CHECKOUT_BASE}/{sessionId}/address`]: {
      patch: {
        tags: ["User Checkout"],
        summary: "Set checkout address",
        description: `
Select an address for the checkout session.

This assigns a shipping address to the current checkout session.  
It does not change the user's default address.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: checkoutSessionParamsSchema
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: setCheckoutAddressSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Checkout address updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          404: notFoundError("Checkout session or address not found")
        }
      }
    },

    [`${CHECKOUT_BASE}/{sessionId}/shipping-cost`]: {
      post: {
        tags: ["User Checkout"],
        summary: "Calculate shipping cost",
        description: `
Calculate available shipping services and costs for the checkout session.

This endpoint returns a list of available courier services based on the selected address and cart weight.

Note:  

A valid address must be selected before calculating shipping.  
The result should be used for selecting a courier service in the next step.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: checkoutSessionParamsSchema
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: calculateShippingSchema
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
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        courier: {
                          type: "string",
                          example: "jne"
                        },
                        services: {
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
                                example: 18000
                              },
                              etd: {
                                type: "string",
                                example: "1 day"
                              }
                            }
                          },
                          example: [
                            {
                              name: "Jalur Nugraha Ekakurir (JNE)",
                              code: "jne",
                              service: "REG",
                              description: "Layanan Reguler",
                              cost: 18000,
                              etd: "1 day"
                            },
                            {
                              name: "Jalur Nugraha Ekakurir (JNE)",
                              code: "jne",
                              service: "YES",
                              description: "Yakin Esok Sampai",
                              cost: 30000,
                              etd: "1 day"
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

          400: badRequestError("Address is required before calculating shipping"),
          401: unauthorizedError(),
          404: notFoundError("Checkout session not found")
        }
      }
    },

    [`${CHECKOUT_BASE}/{sessionId}/shipping-method`]: {
      patch: {
        tags: ["User Checkout"],
        summary: "Set shipping method",
        description: `
Select a shipping method for the checkout session.

This assigns the selected courier service to the checkout session and updates shipping cost and delivery estimation.

Note:  

The courier service must be selected from the result of the shipping cost calculation.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: checkoutSessionParamsSchema
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: setShippingMethodSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Shipping method selected"
                })
              }
            }
          },

          400: badRequestError("Invalid shipping method"),
          401: unauthorizedError(),
          404: notFoundError("Checkout session not found")
        }
      }
    },

    [`${CHECKOUT_BASE}/{sessionId}/confirm`]: {
      post: {
        tags: ["User Checkout"],
        summary: "Confirm checkout",
        description: `
Finalize the checkout session and create an order.

This endpoint validates all checkout data, locks stock, and creates an order from the session.

Note:  

The checkout session must be complete and valid.
All items must be available with sufficient stock.
Address and shipping method must be selected.
The session must not be expired or already used.

Common reasons:  

Checkout session expired
Items are unavailable or out of stock
Address or shipping method not set  

On success, an order will be created and the cart will be cleared.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: checkoutSessionParamsSchema
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
                      properties: {
                        orderCode: {
                          type: "string",
                          example: "ORD-20260501-ABC123"
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          400: badRequestError("Checkout is not ready or invalid"),
          401: unauthorizedError(),
          404: notFoundError("Checkout session not found")
        }
      }
    }
  }
};
