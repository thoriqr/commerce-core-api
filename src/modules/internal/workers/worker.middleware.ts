import { NextFunction, Request, Response } from "express";

import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";

export function requireWorker(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.get("authorization");

    if (!header?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Unauthorized");
    }

    const token = header.slice("Bearer ".length).trim();

    if (token !== env.WORKER_SECRET) {
      throw AppError.unauthorized("Unauthorized");
    }

    return next();
  } catch (err) {
    return next(err);
  }
}
