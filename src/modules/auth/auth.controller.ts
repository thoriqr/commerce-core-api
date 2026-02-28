import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "@/utils/send-success";
import { AppError } from "@/errors/app-error";
import { loginSchema } from "./auth.schema";
import { setAuthCookies } from "@/utils/set-auth-cookie";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
  };

  verifyEmail = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
  };

  login = async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await this.service.login(payload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 200, { data: { user } });
  };

  refresh = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
  };

  logout = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
  };

  requestPasswordReset = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
  };

  resetPassword = async (req: Request, res: Response) => {
    sendSuccess(res, 200);
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
