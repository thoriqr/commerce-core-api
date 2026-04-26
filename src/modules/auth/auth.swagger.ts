import { ROUTES } from "@/constants/routes";
import { unauthorizedError, validationError } from "@/docs/swagger/helpers/error.helper";

import { authUserSchema, loginSchema } from "./auth.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const AUTH_BASE = ROUTES.AUTH;

export const authSwagger = {
  tags: [
    {
      name: "Auth",
      description: "Authentication endpoints"
    }
  ],

  paths: {
    [`${AUTH_BASE}/login`]: {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        description: "Authenticate user and return access token",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: loginSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Logged in successfully"
                })
              }
            }
          },

          400: validationError([{ field: "email", message: "Invalid email format" }]),

          401: unauthorizedError("Invalid email or password")
        }
      }
    },

    [`${AUTH_BASE}/me`]: {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        description: `Requires authentication. This endpoint uses access_token stored in HttpOnly cookie. Cookies are automatically sent by the browser.`,

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
                schema: successResponse({
                  data: authUserSchema,

                  dataExample: {
                    id: 2,
                    email: "testuser1@example.com",
                    role: "ADMIN",
                    displayName: "Test User1",
                    isDemo: false
                  }
                })
              }
            }
          },
          401: unauthorizedError()
        }
      }
    }
  }
};
