import { Response } from "express";
import { env } from "@/config/env";
import { getCookieNames } from "./auth-cookies";
import { AppClient } from "@/types/app-client";

const isProd = env.NODE_ENV === "production";

export const baseCookieOptions = {
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  path: "/",
  domain: isProd ? ".commerce.web.id" : undefined
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string, client: AppClient) {
  const cookies = getCookieNames(client);

  res.cookie(cookies.access, accessToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie(cookies.refresh, refreshToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export function clearAuthCookies(res: Response, client: AppClient) {
  const cookies = getCookieNames(client);

  res.clearCookie(cookies.access, {
    ...baseCookieOptions,
    httpOnly: true
  });

  res.clearCookie(cookies.refresh, {
    ...baseCookieOptions,
    httpOnly: true
  });
}
