import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";
import rateLimit from "express-rate-limit";

const MINUTE = 60 * 1000;

export const globalLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 1000,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests());
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 10,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests());
  },
  skip: () => env.NODE_ENV === "test"
});

export const actionLimiter = rateLimit({
  windowMs: 1 * MINUTE,
  max: 30,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many actions, slow down a bit"));
  }
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 50,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many session refresh attempts"));
  }
});

export const searchLimiter = rateLimit({
  windowMs: 1 * MINUTE,
  max: 50,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many search requests"));
  }
});
