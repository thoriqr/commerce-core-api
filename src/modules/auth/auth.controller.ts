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
  refreshTokenSchema,
  resetPasswordSchema,
  setPasswordSchema,
  validateAdminInviteSchema,
  verifyAdminInvite,
  verifyEmailSchema
} from "./auth.schema";
import { getCookieNames } from "@/utils/auth-cookies";
import { clearAuth, getSessionMetadata, resolveAuthTransport, sendAuth } from "@/utils/auth-helpers";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  inviteAdmin = async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    await this.service.inviteAdmin(req.user!, payload.email);

    sendSuccess(res, 200, {
      message: "Admin invitation email sent"
    });
  };

  validateInviteAdmin = async (req: Request, res: Response) => {
    const { token } = validateAdminInviteSchema.parse(req.params);

    const data = await this.service.validateAdminInvite(token);
    sendSuccess(res, 200, {
      data
    });
  };

  acceptAdminInvite = async (req: Request, res: Response) => {
    const payload = verifyAdminInvite.parse(req.body);

    const tokens = await this.service.acceptAdminInvite(payload, getSessionMetadata(req));

    sendAuth(res, req, 200, "Admin access granted", tokens, "admin");
  };

  register = async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    await this.service.register(payload);

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

    await this.service.verifyEmail(payload);

    sendSuccess(res, 200, {
      message: "Email verified successfully"
    });
  };

  login = async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);

    const tokens = await this.service.login(payload, getSessionMetadata(req));

    sendAuth(res, req, 200, "Logged in successfully", tokens);
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = this.getRefreshToken(req);

    if (!refreshToken) {
      throw AppError.unauthorized("Refresh token missing");
    }

    const tokens = await this.service.refresh(refreshToken);

    sendAuth(res, req, 200, "Session refreshed", tokens);
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = this.getRefreshToken(req, false);

    if (refreshToken) {
      await this.service.logout(refreshToken);
    }

    if (resolveAuthTransport(req) === "web") {
      clearAuth(res, req);
    }

    sendSuccess(res, 200, {
      message: "Logged out successfully"
    });
  };

  requestPasswordReset = async (req: Request, res: Response) => {
    const payload = requestPasswordResetSchema.parse(req.body);

    await this.service.requestPasswordReset(payload);

    sendSuccess(res, 200, {
      message: "If the email exists, a reset link has been sent."
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const payload = resetPasswordSchema.parse(req.body);

    await this.service.resetPassword(payload);

    if (resolveAuthTransport(req) === "web") {
      clearAuth(res, req);
    }

    sendSuccess(res, 200, {
      message: "Password reset successfully"
    });
  };

  setPassword = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const payload = setPasswordSchema.parse(req.body);

    const tokens = await this.service.setPassword(req.user.id, payload.password, getSessionMetadata(req));

    sendAuth(res, req, 200, "Password set successfully", tokens);
  };

  changePassword = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const payload = changePasswordSchema.parse(req.body);

    const tokens = await this.service.changePassword(req.user.id, payload.currentPassword, payload.newPassword, getSessionMetadata(req));

    sendAuth(res, req, 200, "Password changed successfully", tokens);
  };

  changeEmail = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const payload = changeEmailSchema.parse(req.body);

    await this.service.changeEmail(req.user.id, payload.email);

    sendSuccess(res, 200, {
      message: "Verification email sent"
    });
  };

  confirmEmailChange = async (req: Request, res: Response) => {
    const payload = confirmEmailChangeSchema.parse(req.body);

    const tokens = await this.service.confirmEmailChange(payload.token, getSessionMetadata(req));

    sendAuth(res, req, 200, "Email changed successfully", tokens);
  };

  googleLogin = async (req: Request, res: Response) => {
    const payload = googleLoginSchema.parse(req.body);

    const tokens = await this.service.googleLogin(payload, getSessionMetadata(req));

    sendAuth(res, req, 200, "Login successful", tokens);
  };

  me = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const user = await this.service.me(req.user.id);

    sendSuccess(res, 200, {
      data: user
    });
  };

  private getRefreshToken(req: Request, required = true): string | undefined {
    if (resolveAuthTransport(req) === "mobile") {
      if (!required && !req.body?.refreshToken) {
        return undefined;
      }

      return refreshTokenSchema.parse(req.body).refreshToken;
    }

    const client = req.client ?? "store";
    const cookies = getCookieNames(client);

    return req.cookies?.[cookies.refresh];
  }
}
