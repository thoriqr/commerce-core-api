import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/shared/jwt/jwt.util";
import { AppError } from "@/errors/app-error";
import { setAuthCookies } from "@/utils/set-auth-cookie";
import { AuthService } from "@/modules/auth/auth.service";

export function createRequireAuth(service: AuthService) {
  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      return next(AppError.unauthorized("Access token missing"));
    }

    try {
      const payload = verifyAccessToken(accessToken);

      req.user = {
        id: payload.sub,
        role: payload.role
      };

      return next();
    } catch (err: any) {
      // Expired token → attempt refresh
      if (err?.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
          return next(AppError.unauthorized("Session expired"));
        }

        try {
          const { user, accessToken: newAccess, refreshToken: newRefresh } = await service.refresh(refreshToken);

          setAuthCookies(res, newAccess, newRefresh);

          req.user = {
            id: user.id,
            role: user.role
          };

          return next();
        } catch {
          return next(AppError.unauthorized("Session expired"));
        }
      }

      return next(AppError.unauthorized("Invalid access token"));
    }
  };
}
