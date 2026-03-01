import { Request, Response, NextFunction } from "express";
import { AppError } from "@/errors/app-error";
import { AuthContext } from "@/modules/auth/auth.types";

export function requireRole(...allowedRoles: AuthContext["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("Insufficient permissions"));
    }

    next();
  };
}
