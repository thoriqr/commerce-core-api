import { ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "../admin.constants";
import { forbiddenError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { userAdminQuerySchema } from "./user.admin.schema";

const USER_BASE = `${ROUTES.ADMIN}${ADMIN_ROUTES.USER}`;

export const adminUserSwagger = {
  tags: [
    {
      name: "Admin Users",
      description: "Admin user management"
    }
  ],
  paths: {
    [`${USER_BASE}`]: {
      get: {
        tags: ["Admin Users"],
        summary: "Get users",
        description: `
Retrieve a paginated list of users.

Supports basic search by email.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          query: userAdminQuerySchema
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
                          id: { type: "number", example: 12 },
                          email: {
                            type: "string",
                            example: "user1@example.com"
                          },
                          status: {
                            type: "string",
                            example: "ACTIVE"
                          },
                          createdAt: {
                            type: "string",
                            example: "2026-04-13T17:54:08.786Z"
                          }
                        }
                      },
                      example: [
                        {
                          id: 12,
                          email: "user1@example.com",
                          status: "ACTIVE",
                          createdAt: "2026-04-13T17:54:08.786Z"
                        },
                        {
                          id: 11,
                          email: "user2@example.com",
                          status: "ACTIVE",
                          createdAt: "2026-04-08T17:07:21.073Z"
                        },
                        {
                          id: 10,
                          email: "user3@example.com",
                          status: "INACTIVE",
                          createdAt: "2026-03-30T17:40:57.307Z"
                        }
                      ]
                    },
                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 10 },
                        total: { type: "number", example: 3 },
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
          403: forbiddenError("Admin access required")
        }
      }
    }
  }
};
