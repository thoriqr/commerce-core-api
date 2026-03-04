import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";
import { Request } from "express";

export function getSafeOrigin(req: Request) {
  const origin = req.headers.origin;

  if (!origin || !env.CLIENT_ORIGINS.includes(origin)) {
    throw AppError.badRequest("Invalid origin");
  }

  return origin;
}
