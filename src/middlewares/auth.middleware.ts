import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/shared/jwt/jwt.util";
import { AppError } from "@/errors/app-error";
import { setAuthCookies } from "@/utils/set-auth-cookie";
import { AuthService } from "@/modules/auth/auth.service";

export function createRequireAuth(service: AuthService) {
  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies?.access_token;
      const refreshToken = req.cookies?.refresh_token;

      // Try access token
      const accessUser = tryVerifyAccessToken(accessToken);

      if (accessUser) {
        req.user = accessUser;
        return next();
      }

      // Access missing or expired → try refresh
      if (!refreshToken) {
        throw AppError.unauthorized("Session expired");
      }

      const user = await attemptRefresh(service, refreshToken, res);

      req.user = user;

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

function tryVerifyAccessToken(token?: string) {
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);

    return {
      id: payload.sub,
      role: payload.role
    };
  } catch (err: any) {
    // expired token → allow refresh
    if (err?.name === "TokenExpiredError") {
      return null;
    }

    // invalid token
    throw AppError.unauthorized("Invalid access token");
  }
}

async function attemptRefresh(service: AuthService, refreshToken: string, res: Response) {
  try {
    const { user, accessToken, refreshToken: newRefresh } = await service.refresh(refreshToken);

    setAuthCookies(res, accessToken, newRefresh);

    return {
      id: user.id,
      role: user.role
    };
  } catch {
    throw AppError.unauthorized("Session expired");
  }
}
