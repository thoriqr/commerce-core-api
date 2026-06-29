import { Request, Response } from "express";
import { clearAuthCookies, setAuthCookies } from "./set-auth-cookie";
import { AppClient } from "@/types/app-client";
import { AuthTokenResult, AuthTransport, SessionMetadata } from "@/modules/auth/auth.types";
import { sendSuccess } from "./send-success";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export function resolveClient(req: Request, override?: AppClient): AppClient {
  return override ?? req.client ?? "store";
}

export function resolveAuthTransport(req: Request): AuthTransport {
  return req.header("x-auth-client") === "mobile" ? "mobile" : "web";
}

export function getSessionMetadata(req: Request): SessionMetadata {
  return {
    client: resolveAuthTransport(req),
    userAgent: req.get("user-agent") ?? null,
    ipAddress: req.ip ?? null
  };
}

export function setAuth(res: Response, tokens: Tokens, req: Request, override?: AppClient) {
  const client = resolveClient(req, override);

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, client);
}

export function clearAuth(res: Response, req: Request, override?: AppClient) {
  const client = resolveClient(req, override);

  clearAuthCookies(res, client);
}

export function sendAuth(res: Response, req: Request, statusCode: number, message: string, tokens: AuthTokenResult, override?: AppClient) {
  if (resolveAuthTransport(req) === "mobile") {
    return sendSuccess(res, statusCode, {
      message,
      data: {
        ...(tokens.user ? { user: tokens.user } : {}),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  }

  setAuth(res, tokens, req, override);

  return sendSuccess(res, statusCode, {
    message
  });
}
