import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "@/utils/send-success";
import { AppError } from "@/errors/app-error";
import {
  changeEmailSchema,
  changePasswordSchema,
  checkVerificationTokenSchema,
  confirmEmailChangeSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  setPasswordSchema,
  verifyEmailSchema
} from "./auth.schema";
import { clearAuthCookies, setAuthCookies } from "@/utils/set-auth-cookie";
import { env } from "@/config/env";
import { getSafeOrigin } from "@/utils/get-safe-origin";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  inviteAdmin = async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    await this.service.inviteAdmin(payload.email);

    sendSuccess(res, 200, {
      message: "Verification email sent"
    });
  };

  register = async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    const origin = getSafeOrigin(req);

    await this.service.register(payload, origin);

    sendSuccess(res, 200, {
      message: "Verification email sent"
    });
  };

  checkVerificationToken = async (req: Request, res: Response) => {
    const payload = checkVerificationTokenSchema.parse(req.body);

    const result = await this.service.checkVerificationToken(payload);

    return sendSuccess(res, 200, {
      data: {
        expiresAt: result.expiresAt
      }
    });
  };

  verifyEmail = async (req: Request, res: Response) => {
    const payload = verifyEmailSchema.parse(req.body);

    const { accessToken, refreshToken } = await this.service.verifyEmail(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, {
      message: "Email verified successfully"
    });
  };

  login = async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);

    const { accessToken, refreshToken } = await this.service.login(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, {
      message: "Logged in successfully"
    });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw AppError.unauthorized("Refresh token missing");
    }

    const { accessToken, refreshToken: newRefresh } = await this.service.refresh(refreshToken);

    setAuthCookies(res, accessToken, newRefresh);

    sendSuccess(res, 200, {
      message: "Session refreshed"
    });
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.service.logout(refreshToken);
    }

    clearAuthCookies(res);

    sendSuccess(res, 200, {
      message: "Logged out successfully"
    });
  };

  requestPasswordReset = async (req: Request, res: Response) => {
    const payload = requestPasswordResetSchema.parse(req.body);

    const origin = getSafeOrigin(req);

    await this.service.requestPasswordReset(payload, origin);

    sendSuccess(res, 200, {
      message: "If the email exists, a reset link has been sent."
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const payload = resetPasswordSchema.parse(req.body);

    const { accessToken, refreshToken } = await this.service.resetPassword(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, {
      message: "Password reset successfully"
    });
  };

  setPassword = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const payload = setPasswordSchema.parse(req.body);

    const { accessToken, refreshToken } = await this.service.setPassword(req.user.id, payload.password);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, {
      message: "Password set successfully"
    });
  };

  changePassword = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const payload = changePasswordSchema.parse(req.body);

    const { accessToken, refreshToken } = await this.service.changePassword(req.user.id, payload.currentPassword, payload.newPassword);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, {
      message: "Password changed successfully"
    });
  };

  changeEmail = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const payload = changeEmailSchema.parse(req.body);

    const origin = getSafeOrigin(req);

    await this.service.changeEmail(req.user.id, payload.email, origin);

    sendSuccess(res, 200, {
      message: "Verification email sent"
    });
  };

  confirmEmailChange = async (req: Request, res: Response) => {
    const payload = confirmEmailChangeSchema.parse(req.body);

    const { accessToken, refreshToken } = await this.service.confirmEmailChange(payload.token);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, {
      message: "Email changed successfully"
    });
  };

  googleLogin = async (req: Request, res: Response) => {
    const payload = googleLoginSchema.parse(req.body);

    const origin = getSafeOrigin(req);

    const { user, accessToken, refreshToken } = await this.service.googleLogin(payload);

    setAuthCookies(res, accessToken, refreshToken);

    // Admin panel
    if (origin === env.ADMIN_ORIGIN) {
      return sendSuccess(res, 200, {
        data: { user }
      });
    }

    // Storefront
    return sendSuccess(res, 200, {
      message: "Login successful"
    });
  };

  me = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const origin = getSafeOrigin(req);

    const user = await this.service.me(req.user.id);

    // Admin panel
    if (origin === env.ADMIN_ORIGIN) {
      return sendSuccess(res, 200, {
        data: user
      });
    }

    // Storefront
    const { role, ...userNoRole } = user;
    return sendSuccess(res, 200, {
      data: userNoRole
    });
  };
}
