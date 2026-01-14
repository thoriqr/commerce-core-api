import { ERROR_CODE, ErrorCode } from "../constants/error-code";

export type FieldError = {
  field: string;
  message: string;
};

export type AppErrorOptions = {
  code: ErrorCode;
  statusCode: number;
  errors?: FieldError[] | undefined;
};

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public errors?: FieldError[] | undefined;

  constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.errors = options.errors;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  // 400
  static badRequest(message = "Bad request", errors?: FieldError[]) {
    return new AppError(message, {
      code: ERROR_CODE.BAD_REQUEST,
      statusCode: 400,
      errors
    });
  }

  // 404
  static notFound(message = "Resource not found") {
    return new AppError(message, {
      code: ERROR_CODE.NOT_FOUND,
      statusCode: 404
    });
  }

  // 409
  static conflict(message = "Conflict") {
    return new AppError(message, {
      code: ERROR_CODE.CONFLICT,
      statusCode: 409
    });
  }

  // 401
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, {
      code: ERROR_CODE.UNAUTHORIZED,
      statusCode: 401
    });
  }

  // 403
  static forbidden(message = "Forbidden") {
    return new AppError(message, {
      code: ERROR_CODE.FORBIDDEN,
      statusCode: 403
    });
  }

  static internal(message = "Internal Server Error") {
    return new AppError(message, {
      code: ERROR_CODE.INTERNAL_SERVER_ERROR,
      statusCode: 500
    });
  }
}
