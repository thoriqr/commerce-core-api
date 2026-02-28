import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/shared/jwt/jwt.util";
import { AppError } from "@/errors/app-error";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(AppError.unauthorized("Access token missing"));
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();
  } catch {
    return next(AppError.unauthorized("Invalid or expired access token"));
  }
}
