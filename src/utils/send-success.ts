import { Response } from "express";

type SuccessResponseOptions<T = unknown, M = unknown> = {
  message?: string;
  data?: T;
  meta?: M;
};

export function sendSuccess<T, M = unknown>(res: Response, statusCode: number, options?: SuccessResponseOptions<T, M>) {
  const { message, data, meta } = options || {};

  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {})
  });
}
