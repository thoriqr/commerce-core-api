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
  /**
   * DEFAULT ERROR
   */
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let errors: FieldError[] | undefined = undefined;

  // ZOD  VALIDATION ERROR
  if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid request payload";
    errors = mapZodError(err);
  } else if (err instanceof AppError) {
    // DOMAIN / APPLICATION ERROR
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = "UPLOAD_ERROR";
    message = err.message;
  } else if (err?.code === PG_ERROR_CODE.UNIQUE_VIOLATION) {
    // POSTGRES / KNEX ERROR
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "Resource already exists";
  } else if (err?.code === PG_ERROR_CODE.FOREIGN_KEY_VIOLATION) {
    statusCode = 400;
    code = "INVALID_REFERENCE";
    message = "Invalid foreign key reference";
  }

  // LOGGING (ALWAYS LAST)
  logger.error("request error", {
    path: req.path,
    message: err.message,
    method: req.method,
    statusCode,
    code,
    error: err
  });

  // RESPONSE
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(errors ? { errors } : {})
    }
  });
}
