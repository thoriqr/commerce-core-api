import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/shared/jwt/jwt.util";
import { AppError } from "@/errors/app-error";
import { AuthContext } from "@/modules/auth/auth.types";
import { TokenExpiredError } from "jsonwebtoken";
import { getCookieNames } from "@/utils/auth-cookies";
import { resolveClient } from "@/utils/auth-helpers";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const client = resolveClient(req);
    const cookies = getCookieNames(client);

    const accessToken = req.cookies?.[cookies.access];

    const accessUser = tryVerifyAccessToken(accessToken);

    if (!accessUser) {
      throw AppError.unauthorized("Unauthorized");
    }

    req.user = accessUser;

    return next();
  } catch (err) {
    return next(err);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const client = resolveClient(req);
    const cookies = getCookieNames(client);

    const accessUser = tryVerifyAccessToken(req.cookies?.[cookies.access]);

    if (accessUser) {
      req.user = accessUser;
    }

    return next();
  } catch {
    return next();
  }
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
      role: payload.role,
      isDemo: payload.isDemo ?? false
    };
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      return null;
    }

    throw AppError.unauthorized("Invalid access token");
  }
}

// NOT USED ANYMORE
// export function createRequireAuth(service: AuthService) {
//   return async function requireAuth(req: Request, res: Response, next: NextFunction) {
//     try {
//       const accessToken = req.cookies?.access_token;
//       const refreshToken = req.cookies?.refresh_token;

//       // try access token
//       const accessUser = tryVerifyAccessToken(accessToken);

//       if (accessUser) {
//         req.user = accessUser;
//         return next();
//       }

//       // access expired → try refresh
//       if (!refreshToken) {
//         throw AppError.unauthorized("Session expired");
//       }

//       const user = await attemptRefresh(service, refreshToken, res);

//       req.user = user;

//       return next();
//     } catch (err) {
//       return next(err);
//     }
//   };
// }

// export function createOptionalAuth(service: AuthService) {
//   return async function optionalAuth(req: Request, res: Response, next: NextFunction) {
//     try {
//       const accessToken = req.cookies?.access_token;
//       const refreshToken = req.cookies?.refresh_token;

//       const accessUser = tryVerifyAccessToken(accessToken);

//       if (accessUser) {
//         req.user = accessUser;
//         return next();
//       }

//       // guest request
//       if (!refreshToken) {
//         return next();
//       }

//       try {
//         const user = await attemptRefresh(service, refreshToken, res);
//         req.user = user;
//       } catch {
//         // guest
//       }

//       return next();
//     } catch (err) {
//       return next(err);
//     }
//   };
// }

// async function attemptRefresh(service: AuthService, refreshToken: string, res: Response): Promise<AuthContext> {
//   const { user, accessToken, refreshToken: newRefresh } = await service.refresh(refreshToken);

//   setAuthCookies(res, accessToken, newRefresh);

//   const id = Number(user.id);

//   if (!Number.isInteger(id)) {
//     throw AppError.unauthorized("Invalid user id");
//   }

//   return {
//     id,
//     role: user.role
//   };
// }
