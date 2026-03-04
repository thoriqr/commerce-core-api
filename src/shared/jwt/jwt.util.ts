import jwt, { JsonWebTokenError, SignOptions, TokenExpiredError } from "jsonwebtoken";
import { env } from "@/config/env"; // sesuaikan path kamu
import { AppError } from "@/errors/app-error";
import { AccessTokenPayload } from "@/modules/auth/auth.types";

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // bisa nanti ambil dari env

/* =========================
   Sign Access Token
========================= */

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/* =========================
   Verify Access Token
========================= */

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof decoded === "string") {
    throw new JsonWebTokenError("Invalid token");
  }

  return decoded as AccessTokenPayload;
}
