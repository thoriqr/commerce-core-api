import { generateRefreshToken, hashRefreshToken } from "@/shared/jwt/refresh-token.util";
import { AuthRepo } from "./auth.repo";
import { GoogleLoginInput, LoginInput, RegisterInput, RequestPasswordResetInput, ResetPasswordInput, VerifyEmailInput } from "./auth.schema";
import { AuthUser } from "./auth.types";
import { AppError } from "@/errors/app-error";
import { TransactionManager } from "@/infra/db/transaction-manager";
import bcrypt from "bcrypt";
import { signAccessToken } from "@/shared/jwt/jwt.util";

export class AuthService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: AuthRepo
  ) {}

  register = async (input: RegisterInput): Promise<void> => {};

  verifyEmail = async (input: VerifyEmailInput): Promise<AuthUser> => {};

  login = async (
    input: LoginInput
  ): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    return this.tm.transaction(async (trx) => {
      // Find user
      const user = await this.repo.findUserByEmail(input.email);

      if (!user.password_hash) {
        throw AppError.unauthorized("Invalid email or password");
      }

      // 2Compare password
      const isMatch = await bcrypt.compare(input.password, user.password_hash);

      if (!isMatch) {
        throw AppError.unauthorized("Invalid email or password");
      }

      // Check status
      if (user.status === "SUSPENDED") {
        throw AppError.forbidden("Account suspended");
      }

      if (user.status === "INVITED") {
        throw AppError.forbidden("Account not activated");
      }

      // Generate access token
      const accessToken = signAccessToken({
        sub: String(user.id),
        role: user.role
      });

      // Generate refresh token
      const refreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(refreshToken);
      const expiresAt = this.getRefreshTokenExpiryDate();

      await this.repo.updateLastLoginAt(trx, user.id);

      // Store refresh token
      await this.repo.insertRefreshToken(trx, {
        userId: user.id,
        tokenHash,
        expiresAt,
        replacedById: null
      });

      return {
        user: {
          id: String(user.id),
          email: user.email,
          role: user.role,
          displayName: user.display_name
        },
        accessToken,
        refreshToken
      };
    });
  };

  refresh = async (userId: number, refreshToken: string): Promise<AuthUser> => {
    const tokenHash = hashRefreshToken(refreshToken);

    return this.tm.transaction(async (trx) => {
      // 1️⃣ Find token
      const existingToken = await this.repo.findRefreshTokenByHash(trx, tokenHash);

      if (!existingToken) {
        throw AppError.unauthorized("Invalid refresh token");
      }

      // 2️⃣ Reuse detection
      if (existingToken.revoked_at) {
        await this.repo.revokeAllUserRefreshTokens(trx, existingToken.user_id);

        throw AppError.unauthorized("Refresh token reuse detected");
      }

      // 3️⃣ Expiration check
      if (new Date(existingToken.expires_at) < new Date()) {
        throw AppError.unauthorized("Refresh token expired");
      }

      // 4️⃣ Get user
      const user = await this.repo.findUserById(trx, existingToken.user_id);

      if (!user) {
        throw AppError.unauthorized("User not found");
      }

      // 5️⃣ Generate new refresh token
      const newRefreshToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newRefreshToken);
      const expiresAt = this.getRefreshTokenExpiryDate();

      // 6️⃣ Revoke old token
      await this.repo.revokeRefreshToken(trx, existingToken.id);

      // 7️⃣ Insert new token
      await this.repo.insertRefreshToken(trx, {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
        replacedById: null
      });

      return {
        id: String(user.id),
        email: user.email,
        role: user.role,
        displayName: user.display_name
      };
    });
  };

  logout = async (refreshToken: string): Promise<void> => {};

  requestPasswordReset = async (input: RequestPasswordResetInput): Promise<void> => {};

  resetPassword = async (input: ResetPasswordInput): Promise<void> => {};

  googleLogin = async (input: GoogleLoginInput): Promise<AuthUser> => {};

  me = async (userId: number): Promise<AuthUser> => {
    const user = await this.repo.findUserById(userId);

    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
      displayName: user.display_name
    };
  };

  private getRefreshTokenExpiryDate(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7); // 7 days
    return now;
  }
}
