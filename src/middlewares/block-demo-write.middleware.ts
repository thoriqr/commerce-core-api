import { AppError } from "@/errors/app-error";
import { Request, Response, NextFunction } from "express";

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function blockDemoWrite(req: Request, _res: Response, next: NextFunction) {
  const user = req.user;

  // skip if not user login
  if (!user) return next();

  // only block demo account
  if (!user.isDemo) return next();

  // block write methods
  if (WRITE_METHODS.includes(req.method)) {
    return next(AppError.forbidden("Demo account is read-only"));
  }

  return next();
}
