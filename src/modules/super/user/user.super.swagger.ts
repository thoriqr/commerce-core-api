import { ROUTES } from "@/constants/routes";
import { SUPER_ROUTES } from "../super.constants";
import { userIdParams, userSuperQuerySchema } from "./user.super.schema";
import { forbiddenError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const USER_BASE = `${ROUTES.SUPER}${SUPER_ROUTES.USER}`;

export const superUserSwagger = {
  tags: [
    {
      name: "Super Users",
      description: "Super admin user management"
    }
  ],

  paths: {
    [`${USER_BASE}`]: {
      get: {
        tags: ["Super Users"],
        summary: "Get users",
        description: `
Retrieve a paginated list of users.

This endpoint provides full visibility for super admins, including user roles and demo status.
Supports basic search by email.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          query: userSuperQuerySchema
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
                          id: { type: "number", example: 15 },
                          email: {
                            type: "string",
                            example: "admin@example.com"
                          },
                          status: {
                            type: "string",
                            example: "ACTIVE"
                          },
                          role: {
                            type: "string",
                            example: "SUPER"
                          },
                          isDemo: {
                            type: "boolean",
                            example: false
                          },
                          createdAt: {
                            type: "string",
                            example: "2026-04-19T16:08:52.271Z"
                          }
                        }
                      },
                      example: [
                        {
                          id: 15,
                          email: "superadmin@example.com",
                          status: "ACTIVE",
                          role: "SUPER",
                          isDemo: false,
                          createdAt: "2026-04-19T16:08:52.271Z"
                        },
                        {
                          id: 14,
                          email: "demo@commerce.dev",
                          status: "ACTIVE",
                          role: "SUPER",
                          isDemo: true,
                          createdAt: "2026-04-19T16:08:37.724Z"
                        },
                        {
                          id: 16,
                          email: "admin@example.com",
                          status: "ACTIVE",
                          role: "ADMIN",
                          isDemo: false,
                          createdAt: "2026-04-20T16:53:22.378Z"
                        },
                        {
                          id: 12,
                          email: "user1@example.com",
                          status: "ACTIVE",
                          role: "USER",
                          isDemo: false,
                          createdAt: "2026-04-13T17:54:08.786Z"
                        }
                      ]
                    },
                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 10 },
                        total: { type: "number", example: 7 },
                        totalPages: { type: "number", example: 1 },
                        hasNext: { type: "boolean", example: false },
                        hasPrev: { type: "boolean", example: false }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Super admin access required")
        }
      }
    },

    [`${USER_BASE}/{userId}/revoke-sessions`]: {
      post: {
        tags: ["Super Users"],
        summary: "Revoke user sessions",
        description: `
Revoke all active sessions for a specific user.

This action forces the user to be logged out from all devices.

Note:
- Typically used for security purposes (e.g. compromised accounts or forced logout).
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: userIdParams
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Session revoked"
                })
              }
            }
          },

          401: unauthorizedError(),
          403: forbiddenError("Super admin access required"),
          404: notFoundError("User not found")
        }
      }
    }
  }
};
