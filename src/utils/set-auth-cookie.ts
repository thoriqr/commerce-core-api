import { Response } from "express";
import { env } from "@/config/env";

const isProd = env.NODE_ENV === "production";

const baseCookieOptions = {
  secure: isProd,
  sameSite: "lax" as const,
  path: "/"
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: 15 * 60 * 1000
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", {
    ...baseCookieOptions,
    httpOnly: true
  });

  res.clearCookie("refresh_token", {
    ...baseCookieOptions,
    httpOnly: true
  });
}
