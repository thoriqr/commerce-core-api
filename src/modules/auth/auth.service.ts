import { generateRefreshToken, hashRefreshToken } from "@/shared/jwt/refresh-token.util";
import { AuthRepo } from "./auth.repo";
import { GoogleLoginInput, LoginInput, RegisterInput, RequestPasswordResetInput, ResetPasswordInput, VerifyEmailInput } from "./auth.schema";
import { AuthUser } from "./auth.types";
import { AppError } from "@/errors/app-error";
import { TransactionManager } from "@/infra/db/transaction-manager";
import bcrypt from "bcrypt";
import { signAccessToken } from "@/shared/jwt/jwt.util";
import { verifyGoogleIdToken } from "@/shared/google/google.util";
import { UserDetailRow } from "./auth.repo.types";
import { Knex } from "knex";
import { logger } from "@/libs/logger";

export class AuthService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: AuthRepo
  ) {}

  inviteAdmin = async (email: string): Promise<void> => {
    return this.tm.transaction(async (trx) => {
      // Reject if email already exists
      const existingUser = await this.repo.findUserByEmailOrNull(email, trx);

      if (existingUser) {
        throw AppError.conflict("Email already registered");
      }

      // Delete old pending invites
      await this.repo.deletePendingByEmailAndType(trx, email, "INVITE");

      // Generate token
      const token = generateRefreshToken(); // reuse util
      const tokenHash = hashRefreshToken(token);

      const expiresAt = this.getShortExpiry(15);

      // Insert pending verification
      await this.repo.insertPendingVerification(trx, {
        email,
        tokenHash,
        type: "INVITE",
        expiresAt
      });

      // 5️⃣ TODO: send email with token
      // await mailer.sendInvite(email, token);
    });
  };

  register = async (input: RegisterInput): Promise<void> => {
    const email = input.email.trim().toLowerCase();

    return this.tm.transaction(async (trx) => {
      // Check if already exists
      const existingUser = await this.repo.findUserByEmailOrNull(email, trx);

      if (existingUser) {
        throw AppError.conflict("Email already registered");
      }

      // Delete old pending
      await this.repo.deletePendingByEmailAndType(trx, email, "REGISTER");

      // Generate token
      const rawToken = generateRefreshToken(); // reuse util
      const tokenHash = hashRefreshToken(rawToken);

      console.log("REGISTER RAW TOKEN:", rawToken);

      const expiresAt = this.getShortExpiry(15);

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

  verifyEmail = async (input: VerifyEmailInput) => {
    const tokenHash = hashRefreshToken(input.token);

    return this.tm.transaction(async (trx) => {
      const pending = await this.repo.findPendingVerification(trx, tokenHash, "REGISTER");

      if (!pending) {
        throw AppError.unauthorized("Invalid token");
      }

      if (pending.used_at) {
        throw AppError.unauthorized("Token already used");
      }

      if (new Date(pending.expires_at) < new Date()) {
        throw AppError.unauthorized("Token expired");
      }

      // REGISTER only
      const role = "USER";

      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await this.repo.insertUserWithRole(trx, {
        email: pending.email,
        passwordHash,
        displayName: input.displayName,
        role,
        status: "ACTIVE"
      });

      await this.repo.markPendingVerificationUsed(trx, pending.id);

      const accessToken = this.issueAccessToken(user);
      const refreshToken = await this.issueRefreshToken(trx, user.id);

      return {
        user: this.buildAuthUser(user),
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
      const user = await this.repo.findUserByEmailOrNull(input.email, trx);

      if (!user || !user.password_hash) {
        throw AppError.unauthorized("Invalid email or password");
      }

      const isMatch = await bcrypt.compare(input.password, user.password_hash);

      if (!isMatch) {
        throw AppError.unauthorized("Invalid email or password");
      }

      if (user.status === "SUSPENDED") {
        throw AppError.forbidden("Account suspended");
      }

      await this.repo.updateLastLoginAt(trx, user.id);

      const accessToken = this.issueAccessToken(user);
      const refreshToken = await this.issueRefreshToken(trx, user.id);

      return {
        user: this.buildAuthUser(user),
        accessToken,
        refreshToken
      };
    });
  };

  googleLogin = async (input: GoogleLoginInput) => {
    const google = await verifyGoogleIdToken(input.idToken);

    if (!google.email_verified) {
      throw AppError.unauthorized("Google email not verified");
    }

    const email = google.email.toLowerCase();

    return this.tm.transaction(async (trx) => {
      let user = await this.repo.findUserByEmailOrNull(email, trx);

      if (!user) {
        user = await this.repo.insertUserWithRole(trx, {
          email,
          passwordHash: null,
          displayName: google.name ?? null,
          role: "USER",
          status: "ACTIVE"
        });
      }

      if (user.status === "SUSPENDED") {
        throw AppError.forbidden("Account suspended");
      }

      await this.repo.insertUserProviderIfNotExists(trx, {
        userId: user.id,
        provider: "GOOGLE",
        providerUserId: google.sub,
        email
      });

      const accessToken = this.issueAccessToken(user);
      const refreshToken = await this.issueRefreshToken(trx, user.id);

      return {
        user: this.buildAuthUser(user),
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

      const user = await this.repo.findUserById(existingToken.user_id, trx);

      if (!user || user.status === "SUSPENDED") {
        await this.repo.revokeAllUserRefreshTokens(trx, existingToken.user_id);
        throw AppError.forbidden("Account suspended");
      }

      // Revoke old token
      await this.repo.revokeRefreshToken(trx, existingToken.id);

      // Generate new tokens
      const newAccessToken = this.issueAccessToken(user);
      const newRefreshToken = await this.issueRefreshToken(trx, user.id, existingToken.id);

      return {
        user: this.buildAuthUser(user),
        accessToken: newAccessToken,
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
      const user = await this.repo.findUserByEmailOrNull(email);

      if (!user) {
        return; // silent success
      }

      // Delete old pending reset
      await this.repo.deletePendingByEmailAndType(trx, email, "RESET_PASSWORD");

      // Generate token
      const rawToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawToken);

      console.log("REQUEST PASSWORD RESET RAW TOKEN:", rawToken);

      const expiresAt = this.getShortExpiry(15);

      // Insert pending RESET_PASSWORD
      await this.repo.insertPendingVerification(trx, {
        email,
        tokenHash,
        type: "RESET_PASSWORD",
        expiresAt,
        userId: user.id
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
      // ind RESET_PASSWORD verification
      const verification = await this.repo.findPendingVerification(trx, tokenHash, "RESET_PASSWORD");

      if (!verification) {
        throw AppError.badRequest("Invalid or expired token");
      }

      // Check used
      if (verification.used_at) {
        throw AppError.badRequest("Token already used");
      }

      // Check expired
      if (new Date(verification.expires_at) < new Date()) {
        throw AppError.badRequest("Token expired");
      }

      // Must have user_id
      if (!verification.user_id) {
        throw AppError.badRequest("Invalid token");
      }

      // Get user
      const user = await this.repo.findUserById(verification.user_id, trx);

      if (!user) {
        throw AppError.unauthorized("User not found");
      }

      if (user.status !== "ACTIVE") {
        throw AppError.forbidden("Account not active");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.password, 10);

      // Update password
      await this.repo.updateUserPassword(trx, user.id, newPasswordHash);

      // Mark token used
      await this.repo.markPendingVerificationUsed(trx, verification.id);

      // Revoke ALL existing refresh tokens
      await this.repo.revokeAllUserRefreshTokens(trx, user.id);

      // Refetch fresh user (clean & future-proof)
      const freshUser = await this.repo.findUserById(user.id, trx);

      if (!freshUser) {
        logger.error("User disappeared during reset");
        throw AppError.internal();
      }

      // Issue new tokens (auto-login)
      const accessToken = this.issueAccessToken(freshUser);
      const refreshToken = await this.issueRefreshToken(trx, freshUser.id);

      return {
        user: this.buildAuthUser(freshUser),
        accessToken,
        refreshToken
      };
    });
  };

  me = async (userId: number): Promise<AuthUser> => {
    const user = await this.repo.findUserById(userId);

    if (!user) {
      throw AppError.unauthorized();
    }

    return this.buildAuthUser(user);
  };

  private buildAuthUser(user: UserDetailRow): AuthUser {
    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
      displayName: user.display_name
    };
  }

  private getShortExpiry(minutes: number): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
  }

  private getRefreshTokenExpiryDate(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7); // 7 days
    return now;
  }

  private issueAccessToken(user: UserDetailRow): string {
    return signAccessToken({
      sub: String(user.id),
      role: user.role
    });
  }

  private async issueRefreshToken(trx: Knex.Transaction, userId: number, replacedById: number | null = null): Promise<string> {
    const refreshToken = generateRefreshToken();

    console.log("ISSUE REFRESH RAW:", refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = this.getRefreshTokenExpiryDate();

    await this.repo.insertRefreshToken(trx, {
      userId,
      tokenHash,
      expiresAt,
      replacedById
    });

    return refreshToken;
  }
}
