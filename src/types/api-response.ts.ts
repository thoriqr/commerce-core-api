export type FieldError = {
  field: string;
  message: string;
};

export type ErrorDetail = {
  code: string;
  message: string;
  errors?: FieldError[];
};

export type ErrorResponse = {
  success: false;
  error: ErrorDetail;
};

export type SuccessResponse<T, M = unknown> = {
  success: true;
  data: T;
  meta?: M;
};

export type ApiResponse<T, M = unknown> = SuccessResponse<T, M> | ErrorResponse;
