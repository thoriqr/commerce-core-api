import { ERROR_CODE } from "@/constants/error-code";
import { FieldError } from "@/types/api-response.ts";
import z from "zod";

type ErrorResponseOptions = {
  status?: number;
  description?: string;
  code: string;
  message: string;
  errors?: FieldError[];
};

export const ErrorResponseSchema = z.object({
  success: z.literal(false),

  error: z.object({
    code: z.string().meta({
      example: "VALIDATION_ERROR"
    }),

    message: z.string().meta({
      example: "Invalid request payload"
    }),

    errors: z
      .array(
        z.object({
          field: z.string(),
          message: z.string()
        })
      )
      .optional()
  })
});

export function errorResponse(options: ErrorResponseOptions) {
  const { description = "Error response", code, message, errors } = options;

  return {
    description,
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
        example: {
          success: false,
          error: {
            code,
            message,
            ...(errors ? { errors } : {})
          }
        }
      }
    }
  };
}

export const validationError = (errors?: FieldError[]) =>
  errorResponse({
    description: "Validation error",
    code: ERROR_CODE.VALIDATION_ERROR,
    message: "Invalid request payload",
    ...(errors ? { errors } : {})
  });

export const badRequestError = (message = "Bad request") =>
  errorResponse({
    description: "Bad request",
    code: ERROR_CODE.BAD_REQUEST,
    message
  });

export const unauthorizedError = (message = "Unauthorized") =>
  errorResponse({
    description: "Unauthorized",
    code: ERROR_CODE.UNAUTHORIZED,
    message
  });

export const forbiddenError = (message = "Forbidden") =>
  errorResponse({
    description: "Forbidden",
    code: ERROR_CODE.FORBIDDEN,
    message
  });

export const notFoundError = (message = "Resource not found") =>
  errorResponse({
    description: "Not found",
    code: ERROR_CODE.NOT_FOUND,
    message
  });

export const conflictError = (message = "Conflict") =>
  errorResponse({
    description: "Conflict",
    code: ERROR_CODE.CONFLICT,
    message
  });

export const tooManyRequestsError = (message = "Too many attempts, please try again later") =>
  errorResponse({
    description: "Too many requests",
    code: ERROR_CODE.TOO_MANY_REQUESTS,
    message
  });

export const serverError = (message = "Internal server error") =>
  errorResponse({
    description: "Internal server error",
    code: ERROR_CODE.INTERNAL_SERVER_ERROR,
    message
  });
