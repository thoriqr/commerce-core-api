import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "@/utils/send-success";
import { AppError } from "@/errors/app-error";
import { loginSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema, verifyEmailSchema } from "./auth.schema";
import { clearAuthCookies, setAuthCookies } from "@/utils/set-auth-cookie";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    await this.service.register(payload);

    sendSuccess(res, 200, {
      message: "Verification email sent"
    });
  };

  verifyEmail = async (req: Request, res: Response) => {
    const payload = verifyEmailSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await this.service.verifyEmail(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, { data: { user } });
  };

  login = async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await this.service.login(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, { data: { user } });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw AppError.unauthorized("Refresh token missing");
    }

    const { user, accessToken, refreshToken: newRefresh } = await this.service.refresh(refreshToken);

    setAuthCookies(res, accessToken, newRefresh);

    sendSuccess(res, 200, { data: { user } });
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

    await this.service.requestPasswordReset(payload);

    sendSuccess(res, 200, {
      message: "If the email exists, a reset link has been sent."
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const payload = resetPasswordSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await this.service.resetPassword(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, { data: { user } });
  };

  googleLogin = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
  };

  me = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const user = await this.service.me(Number(req.user.id));

    sendSuccess(res, 200, { data: user });
  };
}
