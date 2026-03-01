import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { UserDetailRow, UserRow, VerificationType } from "./auth.repo.types";
import { UserRole } from "@/shared/user/user.types";
import { logger } from "@/libs/logger";

export class AuthRepo {
  async findRefreshTokenByHash(trx: Knex.Transaction, hash: string) {
    const { rows } = await trx.raw<{ rows: Array<{ id: number; user_id: number; expires_at: Date; revoked_at: Date | null }> }>(
      `
    SELECT id, user_id, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = :hash
    `,
      { hash }
    );

    return rows[0] ?? null;
  }

  async revokeRefreshToken(trx: Knex.Transaction, tokenId: number) {
    await trx.raw(
      `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE id = :tokenId
    `,
      { tokenId }
    );
  }

  async revokeAllUserRefreshTokens(trx: Knex.Transaction, userId: number) {
    await trx.raw(
      `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = :userId
      AND revoked_at IS NULL
    `,
      { userId }
    );
  }

  async insertRefreshToken(
    trx: Knex.Transaction,
    data: {
      userId: number;
      tokenHash: string;
      expiresAt: Date;
      replacedById: number | null;
    }
  ) {
    const { rows } = await trx.raw<{
      rows: Array<{ id: number }>;
    }>(
      `
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at,
      replaced_by_id
    )
    VALUES (
      :userId,
      :tokenHash,
      :expiresAt,
      :replacedById
    )
    RETURNING id
    `,
      {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        replacedById: data.replacedById
      }
    );

    return rows[0];
  }

  async findUserByEmail(email: string) {
    const { rows } = await db.raw<{
      rows: UserDetailRow[];
    }>(
      `
    SELECT id, email, password_hash, role, status, display_name
    FROM users
    WHERE email = :email
    `,
      { email }
    );

    const user = rows[0];

    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    return user;
  }

  async findUserById(userId: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{ rows: UserRow[] }>(
      `
    SELECT id, email, role, display_name, status
    FROM users
    WHERE id = :userId
    `,
      { userId }
    );

    const user = rows[0];

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return user;
  }

  async updateLastLoginAt(trx: Knex.Transaction, userId: number) {
    await trx.raw(
      `
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = :userId
    `,
      { userId }
    );
  }

  async deletePendingRegisterByEmail(trx: Knex.Transaction, email: string) {
    await trx.raw(
      `
    DELETE FROM pending_verifications
    WHERE email = :email
      AND type = 'REGISTER'
      AND used_at IS NULL
    `,
      { email }
    );
  }

  async insertPendingVerification(
    trx: Knex.Transaction,
    data: {
      email: string;
      tokenHash: string;
      type: VerificationType;
      expiresAt: Date;
    }
  ) {
    await trx.raw(
      `
    INSERT INTO pending_verifications (
      email,
      token_hash,
      type,
      expires_at
    )
    VALUES (
      :email,
      :tokenHash,
      :type,
      :expiresAt
    )
    `,
      {
        email: data.email,
        tokenHash: data.tokenHash,
        type: data.type,
        expiresAt: data.expiresAt
      }
    );
  }

  async findPendingVerificationByHash(trx: Knex.Transaction, hash: string) {
    const { rows } = await trx.raw<{ rows: Array<{ id: number; email: string; expires_at: Date; used_at: Date | null; type: VerificationType }> }>(
      `
    SELECT id, email, expires_at, used_at, type
    FROM pending_verifications
    WHERE token_hash = :hash
    `,
      { hash }
    );

    return rows[0] ?? null;
  }

  async markPendingVerificationUsed(trx: Knex.Transaction, id: number) {
    await trx.raw(
      `
    UPDATE pending_verifications
    SET used_at = NOW()
    WHERE id = :id
    `,
      { id }
    );
  }

  async insertUser(
    trx: Knex.Transaction,
    data: {
      email: string;
      passwordHash: string;
      displayName: string;
    }
  ) {
    const { rows } = await trx.raw<{ rows: Array<{ id: number; email: string; role: UserRole; display_name: string }> }>(
      `
    INSERT INTO users (
      email,
      password_hash,
      role,
      status,
      display_name
    )
    VALUES (
      :email,
      :passwordHash,
      'USER',
      'ACTIVE',
      :displayName
    )
    RETURNING id, email, role, display_name
    `,
      {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName
      }
    );

    const row = rows[0];

    if (!row) {
      logger.error("Insert users returned no rows");
      throw AppError.internal();
    }

    return row;
  }

  async findUserByEmailOptional(email: string) {
    const { rows } = await db.raw<{
      rows: Array<{ id: number; email: string }>;
    }>(
      `
    SELECT id, email
    FROM users
    WHERE email = :email
    `,
      { email }
    );

    return rows[0] ?? null;
  }

  async deletePendingResetByEmail(trx: Knex.Transaction, email: string) {
    await trx.raw(
      `
    DELETE FROM pending_verifications
    WHERE email = :email
      AND type = 'RESET_PASSWORD'
      AND used_at IS NULL
    `,
      { email }
    );
  }

  async findPendingVerificationByTokenHash(trx: Knex.Transaction, tokenHash: string, type: "RESET_PASSWORD") {
    const { rows } = await trx.raw<{
      rows: Array<{
        id: number;
        user_id: number | null;
        email: string;
        expires_at: Date;
        used_at: Date | null;
      }>;
    }>(
      `
    SELECT id, user_id, email, expires_at, used_at
    FROM pending_verifications
    WHERE token_hash = :tokenHash
      AND type = :type
    `,
      { tokenHash, type }
    );

    return rows[0] ?? null;
  }

  async updateUserPassword(trx: Knex.Transaction, userId: number, passwordHash: string) {
    await trx.raw(
      `
    UPDATE users
    SET password_hash = :passwordHash
    WHERE id = :userId
    `,
      { userId, passwordHash }
    );
  }
}
