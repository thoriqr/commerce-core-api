import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { forbiddenError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { getDashboardSchema } from "./dashboard.schema";

const DASHBOARD_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.DASHBOARD}`;

export const adminDashboardSwagger = {
  tags: [
    {
      name: "Admin Dashboard",
      description: "Admin dashboard management"
    }
  ],

  paths: {
    [`${DASHBOARD_BASE}`]: {
      get: {
        tags: ["Admin Dashboard"],
        summary: "Get dashboard data",
        description: `
Retrieve dashboard statistics and analytics.

Includes summary metrics, charts, best selling products, and recent orders.  
Supports optional date filtering.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          query: getDashboardSchema
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
                        summary: {
                          type: "object",
                          properties: {
                            totalOrders: { type: "number", example: 12 },
                            totalRevenue: { type: "number", example: 3250000 }
                          }
                        },

                        revenueChart: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              month: {
                                type: "string",
                                example: "2026-04"
                              },
                              revenue: {
                                type: "number",
                                example: 3250000
                              }
                            }
                          },
                          example: [
                            { month: "2026-03", revenue: 1200000 },
                            { month: "2026-04", revenue: 3250000 }
                          ]
                        },

                        ordersChart: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              date: {
                                type: "string",
                                example: "2026-04-01"
                              },
                              orders: {
                                type: "number",
                                example: 3
                              }
                            }
                          },
                          example: [
                            { date: "2026-04-01", orders: 2 },
                            { date: "2026-04-02", orders: 1 },
                            { date: "2026-04-03", orders: 3 }
                          ]
                        },

                        bestSelling: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number", example: 101 },
                              name: {
                                type: "string",
                                example: "Basic T-Shirt"
                              },
                              sold: {
                                type: "number",
                                example: 120
                              }
                            }
                          },
                          example: [
                            { id: 101, name: "Basic T-Shirt", sold: 120 },
                            { id: 102, name: "Classic Hoodie", sold: 85 },
                            { id: 103, name: "Denim Jacket", sold: 60 }
                          ]
                        },

                        recentOrders: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              orderCode: {
                                type: "string",
                                example: "ORD-20260425-XYZ123"
                              },
                              total: {
                                type: "number",
                                example: 150000
                              },
                              status: {
                                type: "string",
                                example: "WAITING_PAYMENT"
                              },
                              rawStatus: {
                                type: "string",
                                example: "PENDING"
                              },
                              paymentStatus: {
                                type: "string",
                                example: "UNPAID"
                              },
                              shipmentStatus: {
                                type: "string",
                                example: "PENDING"
                              },
                              createdAt: {
                                type: "string",
                                example: "2026-04-25T21:17:49.453Z"
                              },
                              recipientName: {
                                type: "string",
                                example: "John Doe"
                              }
                            }
                          },
                          example: [
                            {
                              orderCode: "ORD-20260425-XYZ123",
                              total: 150000,
                              status: "WAITING_PAYMENT",
                              rawStatus: "PENDING",
                              paymentStatus: "UNPAID",
                              shipmentStatus: "PENDING",
                              createdAt: "2026-04-25T21:17:49.453Z",
                              recipientName: "John Doe"
                            },
                            {
                              orderCode: "ORD-20260424-ABC789",
                              total: 320000,
                              status: "READY_TO_SHIP",
                              rawStatus: "PENDING",
                              paymentStatus: "PAID",
                              shipmentStatus: "PENDING",
                              createdAt: "2026-04-24T10:12:11.000Z",
                              recipientName: "Jane Smith"
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
          403: forbiddenError("Admin access required")
        }
      }
    }
  }
};
