import { ROUTES } from "@/constants/routes";
import { USER_ROUTES } from "../user.constants";
import { badRequestError, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { orderCodeParams, ordersByUserQuerySchema } from "./order.user.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const ORDER_BASE = `${ROUTES.USER}${USER_ROUTES.ORDERS}`;

export const userOrderSwagger = {
  tags: [
    {
      name: "User Orders",
      description: "User order history and details"
    }
  ],
  paths: {
    [`${ORDER_BASE}`]: {
      get: {
        tags: ["User Orders"],
        summary: "Get user orders",
        description: `
Retrieve a list of orders for the authenticated user.

Supports pagination and optional status filtering.

Each order includes a preview item for quick display in the UI.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          query: ordersByUserQuerySchema
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
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 101 },
                          orderCode: {
                            type: "string",
                            example: "ORD-20260501-ABC123"
                          },
                          productId: { type: "number", example: 10 },
                          slug: {
                            type: "string",
                            example: "basic-backpack"
                          },
                          status: {
                            type: "string",
                            example: "WAITING_PAYMENT"
                          },
                          total: {
                            type: "number",
                            example: 250000
                          },
                          createdAt: {
                            type: "string",
                            example: "2026-05-01T10:00:00.000Z"
                          },
                          itemCount: {
                            type: "number",
                            example: 2
                          },

                          previewItem: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                example: "Basic Backpack"
                              },
                              imageKey: {
                                type: "string",
                                example: "products/example.webp"
                              }
                            }
                          },

                          canConfirm: {
                            type: "boolean",
                            example: false
                          }
                        }
                      },
                      example: [
                        {
                          id: 101,
                          orderCode: "ORD-20260501-ABC123",
                          productId: 10,
                          slug: "basic-backpack",
                          status: "WAITING_PAYMENT",
                          total: 250000,
                          createdAt: "2026-05-01T10:00:00.000Z",
                          itemCount: 2,
                          previewItem: {
                            name: "Basic Backpack",
                            imageKey: "products/example.webp"
                          },
                          canConfirm: false
                        },
                        {
                          id: 102,
                          orderCode: "ORD-20260430-XYZ789",
                          productId: 20,
                          slug: "plain-t-shirt",
                          status: "COMPLETED",
                          total: 180000,
                          createdAt: "2026-04-30T08:30:00.000Z",
                          itemCount: 1,
                          previewItem: {
                            name: "Plain T-Shirt",
                            imageKey: "products/example-shirt.webp"
                          },
                          canConfirm: false
                        }
                      ]
                    },

                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 10 },
                        total: { type: "number", example: 25 },
                        totalPages: { type: "number", example: 3 },
                        hasNext: { type: "boolean", example: true },
                        hasPrev: { type: "boolean", example: false }
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

    [`${ORDER_BASE}/{orderCode}`]: {
      get: {
        tags: ["User Orders"],
        summary: "Get order detail",
        description: `
Retrieve detailed information for a specific order.

Includes pricing breakdown, shipping info, timeline, and ordered items.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: orderCodeParams
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
                        },

                        subtotal: { type: "number", example: 250000 },
                        shippingCost: { type: "number", example: 20000 },
                        total: { type: "number", example: 270000 },

                        status: { type: "string", example: "DELIVERED" },
                        rawStatus: { type: "string", example: "COMPLETED" },
                        paymentStatus: { type: "string", example: "PAID" },

                        expiresAt: {
                          type: "string",
                          example: "2026-05-01T10:30:00.000Z"
                        },
                        paidAt: {
                          type: "string",
                          nullable: true,
                          example: "2026-05-01T10:05:00.000Z"
                        },
                        cancelledAt: {
                          type: "string",
                          nullable: true,
                          example: null
                        },

                        canPay: { type: "boolean", example: false },
                        canConfirm: { type: "boolean", example: false },

                        address: {
                          type: "object",
                          properties: {
                            recipientName: {
                              type: "string",
                              example: "John Doe"
                            },
                            phone: {
                              type: "string",
                              example: "081234567890"
                            },
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

                        shipping: {
                          type: "object",
                          properties: {
                            courierCode: { type: "string", example: "jne" },
                            courierName: {
                              type: "string",
                              example: "JNE"
                            },
                            courierService: {
                              type: "string",
                              example: "REG"
                            },
                            etd: {
                              type: "string",
                              example: "2 day"
                            },
                            trackingNumber: {
                              type: "string",
                              example: "JNE123456789"
                            },
                            status: {
                              type: "string",
                              example: "DELIVERED"
                            }
                          }
                        },

                        warehouseOrigin: {
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
                              example: "BENOWO"
                            },
                            postalCode: {
                              type: "string",
                              example: "60195"
                            }
                          }
                        },

                        timeline: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              key: {
                                type: "string",
                                example: "PAID"
                              },
                              label: {
                                type: "string",
                                example: "Payment Confirmed"
                              },
                              date: {
                                type: "string",
                                example: "2026-05-01T10:05:00.000Z"
                              },
                              isCompleted: {
                                type: "boolean",
                                example: true
                              },
                              isCurrent: {
                                type: "boolean",
                                example: false
                              }
                            }
                          }
                        },

                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              productId: { type: "number", example: 10 },
                              variantId: { type: "number", example: 101 },
                              name: {
                                type: "string",
                                example: "Basic Backpack"
                              },
                              slug: {
                                type: "string",
                                example: "basic-backpack"
                              },
                              price: {
                                type: "number",
                                example: 250000
                              },
                              quantity: {
                                type: "number",
                                example: 1
                              },
                              weight: {
                                type: "number",
                                example: 1000
                              },
                              imageKey: {
                                type: "string",
                                example: "products/example.webp"
                              },
                              options: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    value: {
                                      type: "string",
                                      example: "Black"
                                    },
                                    dimension: {
                                      type: "string",
                                      example: "Color"
                                    }
                                  }
                                }
                              }
                            }
                          },
                          example: [
                            {
                              productId: 10,
                              variantId: 101,
                              name: "Basic Backpack",
                              slug: "basic-backpack",
                              price: 250000,
                              quantity: 1,
                              weight: 1000,
                              imageKey: "products/example.webp",
                              options: [
                                {
                                  value: "Black",
                                  dimension: "Color"
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
          },

          401: unauthorizedError(),
          404: notFoundError("Order not found")
        }
      }
    },

    [`${ORDER_BASE}/{orderCode}/cancel`]: {
      post: {
        tags: ["User Orders"],
        summary: "Cancel order",
        description: `
Cancel an order before it is paid or finalized.

Note:
- Only the order owner can perform this action.
- Orders that are already paid cannot be cancelled.
- This operation is idempotent. Cancelling an already cancelled order will still return success.
- Once cancelled, an order cannot be restored.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: orderCodeParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Order cancelled"
                })
              }
            }
          },

          400: badRequestError("Order cannot be cancelled"),
          401: unauthorizedError(),
          403: forbiddenError(),
          404: notFoundError("Order not found")
        }
      }
    },

    [`${ORDER_BASE}/{orderCode}/deliver`]: {
      post: {
        tags: ["User Orders"],
        summary: "Confirm order delivered",
        description: `
Confirm that the order has been received by the user.

This will mark the shipment as delivered and complete the order.

Note:
- Only the order owner can perform this action.
- The order must be in a shipped state.
- This operation is idempotent. If the order is already marked as delivered, it will still return success.
- This action finalizes the order and cannot be reversed.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: orderCodeParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Order delivered"
                })
              }
            }
          },

          400: badRequestError("Order cannot be marked as delivered"),
          401: unauthorizedError(),
          403: forbiddenError(),
          404: notFoundError("Order or shipment not found")
        }
      }
    },

    [`${ORDER_BASE}/{orderCode}/snap-token`]: {
      post: {
        tags: ["User Orders"],
        summary: "Create payment token",
        description: `
Generate or retrieve a Midtrans Snap token for the order.

This token is used to initiate the payment process on the client side.

Note:
- Only unpaid and active orders can request a payment token.
- If a token already exists, the same token will be returned.
- The token can be used with Midtrans Snap (popup or redirect flow).
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: orderCodeParams
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
                        token: {
                          type: "string",
                          example: "snap-token-example-123"
                        },
                        redirect_url: {
                          type: "string",
                          example: "https://app.midtrans.com/snap/v2/vtweb/abc123"
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          400: badRequestError("Order is not payable"),
          401: unauthorizedError(),
          404: notFoundError("Order not found")
        }
      }
    }
  }
};
