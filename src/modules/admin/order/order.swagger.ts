import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { badRequestError, forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { getOrdersQuerySchema, orderIdParams, shipmentSchema } from "./order.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const ORDER_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.ORDER}`;

export const adminOrderSwagger = {
  tags: [
    {
      name: "Admin Orders",
      description: "Admin order management"
    }
  ],

  paths: {
    [`${ORDER_BASE}`]: {
      get: {
        tags: ["Admin Orders"],
        summary: "Get orders",
        description: `
Retrieve a paginated list of orders.

Supports filtering by status, payment status, date range, and search keyword.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          query: getOrdersQuerySchema
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
                          id: { type: "number", example: 38 },
                          orderCode: {
                            type: "string",
                            example: "ORD-20260403-7TARDI"
                          },
                          status: {
                            type: "string",
                            example: "COMPLETED"
                          },
                          rawStatus: {
                            type: "string",
                            example: "COMPLETED"
                          },
                          paymentStatus: {
                            type: "string",
                            example: "PAID"
                          },
                          shipmentStatus: {
                            type: "string",
                            example: "DELIVERED"
                          },
                          total: {
                            type: "number",
                            example: 850000
                          },
                          createdAt: {
                            type: "string",
                            example: "2026-04-03T21:45:20.737Z"
                          },
                          itemCount: {
                            type: "number",
                            example: 1
                          },
                          previewItem: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                example: "Black T Shirt"
                              },
                              imageKey: {
                                type: "string",
                                example: "products/373d0035-0f14-4f48-a48d-dda1a77e47bd.webp"
                              }
                            }
                          },
                          actions: {
                            type: "object",
                            properties: {
                              canShip: {
                                type: "boolean",
                                example: false
                              }
                            }
                          }
                        }
                      },
                      example: [
                        {
                          id: 38,
                          orderCode: "ORD-20260403-7TARDI",
                          status: "COMPLETED",
                          rawStatus: "COMPLETED",
                          paymentStatus: "PAID",
                          shipmentStatus: "DELIVERED",
                          total: 850000,
                          createdAt: "2026-04-03T21:45:20.737Z",
                          itemCount: 1,
                          previewItem: {
                            name: "Black T Shirt",
                            imageKey: "products/373d0035-0f14-4f48-a48d-dda1a77e47bd.webp"
                          },
                          actions: {
                            canShip: false
                          }
                        }
                      ]
                    },
                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 10 },
                        total: { type: "number", example: 51 },
                        totalPages: { type: "number", example: 6 },
                        hasNext: { type: "boolean", example: true },
                        hasPrev: { type: "boolean", example: false }
                      }
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

    [`${ORDER_BASE}/{orderId}`]: {
      get: {
        tags: ["Admin Orders"],
        summary: "Get order by ID",
        description: `
Retrieve detailed information for a specific order.

Includes pricing breakdown, shipping details, payment information, and ordered items.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: orderIdParams
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
                          example: "ORD-20260328-ABC123"
                        },
                        status: {
                          type: "string",
                          example: "COMPLETED"
                        },
                        email: {
                          type: "string",
                          example: "customer@example.com"
                        },

                        pricing: {
                          type: "object",
                          properties: {
                            subtotal: { type: "number", example: 80000 },
                            shippingCost: { type: "number", example: 45000 },
                            total: { type: "number", example: 125000 }
                          }
                        },

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
                              example: "GUBENG"
                            },
                            postalCode: {
                              type: "string",
                              example: "60281"
                            }
                          }
                        },

                        shipment: {
                          type: "object",
                          properties: {
                            courierName: {
                              type: "string",
                              example: "JNE"
                            },
                            courierService: {
                              type: "string",
                              example: "REG"
                            },
                            trackingNumber: {
                              type: "string",
                              example: "1234567890"
                            },
                            status: {
                              type: "string",
                              example: "DELIVERED"
                            },
                            shippedAt: {
                              type: "string",
                              example: "2026-04-08T19:50:43.903Z"
                            },
                            deliveredAt: {
                              type: "string",
                              example: "2026-04-08T19:52:19.398Z"
                            }
                          }
                        },

                        payment: {
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              example: "capture"
                            },
                            method: {
                              type: "string",
                              example: "credit_card"
                            },
                            bank: {
                              type: "string",
                              example: "cimb"
                            },
                            code: {
                              type: "string",
                              nullable: true,
                              example: null
                            },
                            transactionTime: {
                              type: "string",
                              example: "2026-03-28T23:44:13.000Z"
                            },
                            settlementTime: {
                              type: "string",
                              nullable: true,
                              example: null
                            }
                          }
                        },

                        timestamps: {
                          type: "object",
                          properties: {
                            createdAt: {
                              type: "string",
                              example: "2026-03-28T23:43:55.453Z"
                            },
                            paidAt: {
                              type: "string",
                              example: "2026-03-28T23:44:14.237Z"
                            },
                            cancelledAt: {
                              type: "string",
                              nullable: true,
                              example: null
                            }
                          }
                        },

                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                example: "Basic T-Shirt"
                              },
                              slug: {
                                type: "string",
                                example: "basic-t-shirt"
                              },
                              price: {
                                type: "number",
                                example: 40000
                              },
                              quantity: {
                                type: "number",
                                example: 1
                              },
                              imageKey: {
                                type: "string",
                                example: "product_variants/example-image.webp"
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
                              name: "Basic T-Shirt",
                              slug: "basic-t-shirt",
                              price: 40000,
                              quantity: 1,
                              imageKey: "product_variants/example-image.webp",
                              options: [
                                { value: "Black", dimension: "Color" },
                                { value: "M", dimension: "Size" }
                              ]
                            }
                          ]
                        },

                        warehouseOrigin: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              example: "Warehouse Jakarta"
                            },
                            province: {
                              type: "string",
                              example: "DKI JAKARTA"
                            },
                            city: {
                              type: "string",
                              example: "JAKARTA BARAT"
                            },
                            district: {
                              type: "string",
                              example: "KALIDERES"
                            },
                            postalCode: {
                              type: "string",
                              example: "11840"
                            }
                          }
                        },

                        actions: {
                          type: "object",
                          properties: {
                            canShip: {
                              type: "boolean",
                              example: false
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

          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Order not found")
        }
      }
    },

    [`${ORDER_BASE}/{orderId}/ship`]: {
      post: {
        tags: ["Admin Orders"],
        summary: "Mark order as shipped",
        description: `
Mark an order as shipped.

This endpoint is used to simulate the shipping process in the system.
It updates the shipment status and records the provided tracking number.

Note:
- This is a simulated operation and does not integrate with any external shipping or tracking service.
- The tracking number is stored for reference purposes only.
- Once marked as shipped, the order can later be completed by the customer.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: orderIdParams
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: shipmentSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Order marked as shipped"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          403: forbiddenError("Admin access required"),
          404: notFoundError("Order not found")
        }
      }
    }
  }
};
