import { Response } from "express";
import { env } from "@/config/env";

const isProd = env.NODE_ENV === "production";

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60 * 1000 // lebih lama dari JWT
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/"
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/"
  });
}
