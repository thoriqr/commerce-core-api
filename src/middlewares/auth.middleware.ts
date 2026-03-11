import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/shared/jwt/jwt.util";
import { AppError } from "@/errors/app-error";
import { setAuthCookies } from "@/utils/set-auth-cookie";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthContext } from "@/modules/auth/auth.types";

export function createRequireAuth(service: AuthService) {
  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies?.access_token;
      const refreshToken = req.cookies?.refresh_token;

      // 1️⃣ try access token
      const accessUser = tryVerifyAccessToken(accessToken);

      if (accessUser) {
        req.user = accessUser;
        return next();
      }

      // 2️⃣ access expired → try refresh
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

export function createOptionalAuth(service: AuthService) {
  return async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies?.access_token;
      const refreshToken = req.cookies?.refresh_token;

      const accessUser = tryVerifyAccessToken(accessToken);

      if (accessUser) {
        req.user = accessUser;
        return next();
      }

      // guest request
      if (!refreshToken) {
        return next();
      }

      try {
        const user = await attemptRefresh(service, refreshToken, res);
        req.user = user;
      } catch {
        // guest
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

function tryVerifyAccessToken(token?: string): AuthContext | null {
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);

    const id = Number(payload.sub);

    if (!Number.isInteger(id)) {
      throw AppError.unauthorized("Invalid token payload");
    }

    return {
      id,
      role: payload.role
    };
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return null;
    }

    throw AppError.unauthorized("Invalid access token");
  }
}

async function attemptRefresh(service: AuthService, refreshToken: string, res: Response): Promise<AuthContext> {
  try {
    const { user, accessToken, refreshToken: newRefresh } = await service.refresh(refreshToken);

    setAuthCookies(res, accessToken, newRefresh);

    const id = Number(user.id);

    if (!Number.isInteger(id)) {
      throw AppError.unauthorized("Invalid user id");
    }

    return {
      id,
      role: user.role
    };
  } catch {
    throw AppError.unauthorized("Session expired");
  }
}
