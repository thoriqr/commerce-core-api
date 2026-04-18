import { Request, Response } from "express";
import { clearAuthCookies, setAuthCookies } from "./set-auth-cookie";
import { AppClient } from "@/types/app-client";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export function resolveClient(req: Request, override?: AppClient): AppClient {
  return override ?? req.client ?? "store";
}

export function setAuth(res: Response, tokens: Tokens, req: Request, override?: AppClient) {
  const client = resolveClient(req, override);

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, client);
}

export function clearAuth(res: Response, req: Request, override?: AppClient) {
  const client = resolveClient(req, override);

  clearAuthCookies(res, client);
}
