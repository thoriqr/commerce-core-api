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

  register = async (input: RegisterInput): Promise<void> => {
    const email = input.email.trim().toLowerCase();

    return this.tm.transaction(async (trx) => {
      // Check if already exists
      const { rows } = await trx.raw<{ rows: Array<{ id: number }> }>(
        `
      SELECT id
      FROM users
      WHERE email = :email
      `,
        { email }
      );

      if (rows.length > 0) {
        throw AppError.conflict("Email already registered");
      }

      // Delete old pending
      await this.repo.deletePendingRegisterByEmail(trx, email);

      // Generate token
      const rawToken = generateRefreshToken(); // reuse util
      const tokenHash = hashRefreshToken(rawToken);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // insert pending verification
      await this.repo.insertPendingVerification(trx, {
        email,
        tokenHash,
        type: "REGISTER",
        expiresAt
      });

      // 5️⃣ TODO: Send magic link via mailer
      // link example:
      // `${FRONTEND_URL}/verify?token=${rawToken}`
    });
  };

  verifyEmail = async (
    input: VerifyEmailInput
  ): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    const tokenHash = hashRefreshToken(input.token);

    return this.tm.transaction(async (trx) => {
      // Find pending
      const pending = await this.repo.findPendingVerificationByHash(trx, tokenHash);

      if (!pending || pending.type !== "REGISTER") {
        throw AppError.unauthorized("Invalid token");
      }

      if (pending.used_at) {
        throw AppError.unauthorized("Token already used");
      }

      if (new Date(pending.expires_at) < new Date()) {
        throw AppError.unauthorized("Token expired");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Insert user
      const user = await this.repo.insertUser(trx, {
        email: pending.email,
        passwordHash,
        displayName: input.displayName
      });

      // Mark pending used
      await this.repo.markPendingVerificationUsed(trx, pending.id);

      // Generate tokens
      const accessToken = signAccessToken({
        sub: String(user.id),
        role: user.role
      });

      const refreshToken = generateRefreshToken();
      const refreshHash = hashRefreshToken(refreshToken);
      const expiresAt = this.getRefreshTokenExpiryDate();

      await this.repo.insertRefreshToken(trx, {
        userId: user.id,
        tokenHash: refreshHash,
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

      // Compare password
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

  refresh = async (
    refreshToken: string
  ): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    const tokenHash = hashRefreshToken(refreshToken);

    return this.tm.transaction(async (trx) => {
      // Find existing token
      const existingToken = await this.repo.findRefreshTokenByHash(trx, tokenHash);

      if (!existingToken) {
        throw AppError.unauthorized("Invalid refresh token");
      }

      // Reuse detection
      if (existingToken.revoked_at) {
        await this.repo.revokeAllUserRefreshTokens(trx, existingToken.user_id);

        throw AppError.unauthorized("Refresh token reuse detected");
      }

      // Expiry check
      if (new Date(existingToken.expires_at) < new Date()) {
        throw AppError.unauthorized("Refresh token expired");
      }

      // Get user
      const user = await this.repo.findUserById(existingToken.user_id, trx);

      if (user.status === "SUSPENDED") {
        await this.repo.revokeAllUserRefreshTokens(trx, user.id);
        throw AppError.forbidden("Account suspended");
      }

      // Generate new tokens
      const newRefreshToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newRefreshToken);
      const expiresAt = this.getRefreshTokenExpiryDate();

      const accessToken = signAccessToken({
        sub: String(user.id),
        role: user.role
      });

      // Revoke old token
      await this.repo.revokeRefreshToken(trx, existingToken.id);

      // Insert new token
      await this.repo.insertRefreshToken(trx, {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
        replacedById: existingToken.id
      });

      return {
        user: {
          id: String(user.id),
          email: user.email,
          role: user.role,
          displayName: user.display_name
        },
        accessToken,
        refreshToken: newRefreshToken
      };
    });
  };

  logout = async (refreshToken: string): Promise<void> => {
    const tokenHash = hashRefreshToken(refreshToken);

    await this.tm.transaction(async (trx) => {
      const existingToken = await this.repo.findRefreshTokenByHash(trx, tokenHash);

      if (!existingToken) {
        return; // idempotent
      }

      if (!existingToken.revoked_at) {
        await this.repo.revokeRefreshToken(trx, existingToken.id);
      }
    });
  };

  requestPasswordReset = async (input: RequestPasswordResetInput): Promise<void> => {
    const email = input.email.trim().toLowerCase();

    return this.tm.transaction(async (trx) => {
      // Check user (optional, silent)
      const user = await this.repo.findUserByEmailOptional(email);

      if (!user) {
        return; // silent success
      }

      // Delete old pending reset
      await this.repo.deletePendingResetByEmail(trx, email);

      // Generate token
      const rawToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawToken);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Insert pending RESET_PASSWORD
      await this.repo.insertPendingVerification(trx, {
        email,
        tokenHash,
        type: "RESET_PASSWORD",
        expiresAt
      });

      // TODO: send reset email with rawToken
    });
  };

  resetPassword = async (
    input: ResetPasswordInput
  ): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    const tokenHash = hashRefreshToken(input.token);

    return this.tm.transaction(async (trx) => {
      // Find verification
      const verification = await this.repo.findPendingVerificationByTokenHash(trx, tokenHash, "RESET_PASSWORD");

      if (!verification) {
        throw AppError.badRequest("Invalid or expired token");
      }

      if (verification.used_at) {
        throw AppError.badRequest("Token already used");
      }

      if (new Date(verification.expires_at) < new Date()) {
        throw AppError.badRequest("Token expired");
      }

      if (!verification.user_id) {
        throw AppError.badRequest("Invalid token");
      }

      // Get user
      const user = await this.repo.findUserById(verification.user_id);

      if (user.status !== "ACTIVE") {
        throw AppError.forbidden("Account not active");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.password, 10);

      // Update password
      await this.repo.updateUserPassword(trx, user.id, newPasswordHash);

      // Mark token used
      await this.repo.markPendingVerificationUsed(trx, verification.id);

      // Revoke all existing refresh tokens (security)
      await this.repo.revokeAllUserRefreshTokens(trx, user.id);

      // Auto-login
      const accessToken = signAccessToken({
        sub: String(user.id),
        role: user.role
      });

      const refreshToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(refreshToken);
      const expiresAt = this.getRefreshTokenExpiryDate();

      await this.repo.insertRefreshToken(trx, {
        userId: user.id,
        tokenHash: newTokenHash,
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

  googleLogin = async (input: GoogleLoginInput) => {};

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
