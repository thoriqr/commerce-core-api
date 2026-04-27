import { ROUTES } from "@/constants/routes";
import {
  badRequestError,
  conflictError,
  forbiddenError,
  notFoundError,
  unauthorizedError,
  validationError
} from "@/docs/swagger/helpers/error.helper";

import {
  authUserSchema,
  changePasswordSchema,
  checkVerificationTokenSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  setPasswordSchema,
  validateAdminInviteSchema,
  validateAdminSchemaData,
  verifyAdminInvite,
  verifyEmailSchema,
  verifyTokenDataSchema
} from "./auth.schema";
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
        description: "Authenticate user using email and password. Upon success, authentication cookies (access_token and refresh_token) are set.",

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
            headers: {
              "Set-Cookie": {
                description: "Sets authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
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
        tags: ["Session"],
        summary: "Get current user",
        description: "Retrieve the currently authenticated user based on the access_token stored in an HttpOnly cookie.",

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
    },

    [`${AUTH_BASE}/refresh`]: {
      get: {
        tags: ["Session"],
        summary: "Refresh session",
        description:
          "Refresh the user session using a valid refresh_token stored in cookies. Upon success, new authentication cookies (access_token and refresh_token) are issued.",

        security: [
          {
            cookieAuth: []
          }
        ],

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets new authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Session refreshed"
                })
              }
            }
          },

          401: unauthorizedError("Refresh token missing or invalid")
        }
      }
    },

    [`${AUTH_BASE}/logout`]: {
      post: {
        tags: ["Session"],
        summary: "Logout user",
        description:
          "Clear authentication cookies (access_token and refresh_token). This operation is idempotent and can be safely called multiple times.",

        security: [
          {
            cookieAuth: []
          }
        ],

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Clears authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Logged out successfully"
                })
              }
            }
          }
        }
      }
    },

    [`${AUTH_BASE}/register`]: {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        description:
          "Register a new user account. A verification email will be sent to the provided email address to complete the registration process.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: registerSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Verification email sent"
                })
              }
            }
          },

          400: validationError([{ field: "email", message: "Invalid email format" }]),

          409: conflictError("Email already registered")
        }
      }
    },

    [`${AUTH_BASE}/check-verification-token`]: {
      post: {
        tags: ["Auth"],
        summary: "Validate verification token (register/reset password)",
        description:
          "Validate a verification token and return its expiration time if valid. The token will be rejected if it is invalid, expired, or already used.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: checkVerificationTokenSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  data: verifyTokenDataSchema,
                  dataExample: { expiresAt: "2026-04-27T16:58:55.514Z" }
                })
              }
            }
          },

          400: badRequestError("Invalid request payload or token is expired/used"),

          404: notFoundError("Invalid token")
        }
      }
    },

    [`${AUTH_BASE}/verify-email`]: {
      post: {
        tags: ["Auth"],
        summary: "Verify email and authenticate user",
        description:
          "Verify a user's email using a valid token. Upon success, the account is activated and authentication cookies (access_token and refresh_token) are set.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: verifyEmailSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Email verified successfully"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload or token is expired/used"),

          404: notFoundError("Invalid token")
        }
      }
    },

    [`${AUTH_BASE}/request-password-reset`]: {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        description:
          "Request a password reset link. If the email exists, a reset link will be sent. This operation is idempotent and always returns a success response to prevent email enumeration.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: requestPasswordResetSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "If the email exists, a reset link has been sent."
                })
              }
            }
          }
        }
      }
    },

    [`${AUTH_BASE}/reset-password`]: {
      post: {
        tags: ["Auth"],
        summary: "Reset password",
        description:
          "Reset the user password using a valid reset token. Upon success, the password is updated and new authentication cookies (access_token and refresh_token) are set.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: resetPasswordSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Password reset successfully"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload or token is invalid, expired, or already used"),

          401: unauthorizedError("User not found")
        }
      }
    },

    [`${AUTH_BASE}/change-password`]: {
      post: {
        tags: ["Auth"],
        summary: "Change password",
        description:
          "Change the current user's password. Requires authentication. Upon success, the password is updated and new authentication cookies (access_token and refresh_token) are issued.",

        security: [
          {
            cookieAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: changePasswordSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets new authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Password changed successfully"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload or new password is invalid"),

          401: unauthorizedError("Current password is incorrect")
        }
      }
    },

    [`${AUTH_BASE}/google`]: {
      post: {
        tags: ["Auth"],
        summary: "Login with Google",
        description:
          "Authenticate a user using a Google ID token. If the user does not exist, a new account is created. If the user exists, the Google account will be linked. Upon success, authentication cookies (access_token and refresh_token) are set.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: googleLoginSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Login successful"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),

          401: unauthorizedError("Google email is not verified")
        }
      }
    },

    [`${AUTH_BASE}/set-password`]: {
      post: {
        tags: ["Auth"],
        summary: "Set password",
        description:
          "Set a password for the authenticated user. This endpoint is intended for users who signed in using a provider (e.g., Google) and do not yet have a password. Upon success, new authentication cookies (access_token and refresh_token) are issued.",

        security: [
          {
            cookieAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: setPasswordSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets new authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Password set successfully"
                })
              }
            }
          },

          400: badRequestError("Password already set"),

          401: unauthorizedError()
        }
      }
    },

    [`${AUTH_BASE}/invite`]: {
      post: {
        tags: ["Admin Invitation"],
        summary: "Invite admin",
        description:
          "Invite a new admin user by email. Only users with SUPER role can access this endpoint. If the email is valid and not already associated with an admin account, a verification email will be sent.",

        security: [
          {
            cookieAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: registerSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Admin invitation email sent"
                })
              }
            }
          },

          401: unauthorizedError("Authentication required"),

          403: forbiddenError("Insufficient permissions"),

          409: conflictError("User is already an admin")
        }
      }
    },

    [`${AUTH_BASE}/invite/validate/{token}`]: {
      get: {
        tags: ["Admin Invitation"],
        summary: "Validate admin invitation",
        description:
          "Validate an admin invitation token. Returns the invited email and related user information. The response indicates whether the user already has a password set.",

        requestParams: {
          path: validateAdminInviteSchema
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  data: validateAdminSchemaData,
                  dataExample: {
                    email: "admin@example.com",
                    displayName: "John Doe",
                    hasPassword: false
                  }
                })
              }
            }
          },

          400: badRequestError("Invalid token or token is expired/used"),
          404: notFoundError("Invalid token"),
          409: conflictError("User is already an admin")
        }
      }
    },

    [`${AUTH_BASE}/invite/accept`]: {
      post: {
        tags: ["Admin Invitation"],
        summary: "Accept admin invitation",
        description:
          "Accept an admin invitation using a valid token. If the user does not exist, a new admin account will be created. If the user exists, their role will be upgraded to ADMIN. If the user does not have a password (e.g., signed in via a provider), password and display name must be provided. Upon success, authentication cookies (access_token and refresh_token) are set.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: verifyAdminInvite
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            headers: {
              "Set-Cookie": {
                description: "Sets authentication cookies (access_token and refresh_token)",
                schema: {
                  type: "string"
                }
              }
            },
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Admin access granted"
                })
              }
            }
          },

          400: badRequestError("Invalid request or required fields are missing (password/displayName)"),

          404: notFoundError("Invalid token"),

          409: conflictError("User is already an admin")
        }
      }
    }
  }
};
