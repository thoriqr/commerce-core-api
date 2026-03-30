import multer from "multer";
import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { ZodError } from "zod";
import { FieldError } from "@/types/api-response.ts";
import { PG_ERROR_CODE } from "@/constants/pg-error-code";
import { Request, Response, NextFunction } from "express";

function mapZodError(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message
  }));
}

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let errors: FieldError[] | undefined = undefined;

  // ZOD VALIDATION
  if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid request payload";
    errors = mapZodError(err);
  }
  // DOMAIN ERROR
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    errors = err.errors;
  }
  // MULTER
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = "UPLOAD_ERROR";
    message = err.message;
  }
  // POSTGRES
  else if (err?.code === PG_ERROR_CODE.UNIQUE_VIOLATION) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "Resource already exists";
  } else if (err?.code === PG_ERROR_CODE.FOREIGN_KEY_VIOLATION) {
    statusCode = 400;
    code = "INVALID_REFERENCE";
    message = "Invalid foreign key reference";
  }

  /**
   * 🔥 LOG LEVEL CONTROL
   */
  const logPayload = {
    path: req.path,
    method: req.method,
    statusCode,
    code,
    message: err?.message,
    error: err
  };

  if (statusCode >= 500) {
    logger.error("request error", logPayload);
  } else if (statusCode === 401) {
    // 🔥 auth flow (expected)
    logger.info("unauthorized request", logPayload);
  } else if (statusCode >= 400) {
    logger.warn("client error", logPayload);
  } else {
    logger.info("request info", logPayload);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(errors ? { errors } : {})
    }
  });
}
