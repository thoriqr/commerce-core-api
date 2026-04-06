import { Request, Response, NextFunction } from "express";
import { AppError } from "@/errors/app-error";
import { AuthContext } from "@/modules/auth/auth.types";
import { logger } from "@/libs/logger";

export function requireRole(...allowedRoles: AuthContext["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn("Forbidden access attempt", {
        userId: user.id,
        role: user.role,
        path: req.path,
        method: req.method
      });

      return next(AppError.forbidden("Insufficient permissions"));
    }

    return next();
  };
}
