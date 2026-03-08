import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { UserDetailRow, VerificationType } from "./auth.repo.types";
import { Provider, UserProvider, UserRole, UserStatus } from "@/shared/user/user.types";
import { logger } from "@/libs/logger";

export class AuthRepo {
  async findUserById(userId: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{ rows: UserDetailRow[] }>(
      `
    SELECT id, email, password_hash, role, status, display_name
    FROM users
    WHERE id = :userId
    `,
      { userId }
    );

    return rows[0] ?? null;
  }

  async findUserByEmailOrNull(email: string, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: UserDetailRow[];
    }>(
      `
    SELECT id, email, password_hash, role, status, display_name
    FROM users
    WHERE email = :email
    `,
      { email }
    );

    return rows[0] ?? null;
  }

  async findProvidersByUserId(userId: number) {
    const { rows } = await db.raw<{
      rows: {
        provider: Provider;
        provider_email: string | null;
        provider_display_name: string | null;
        provider_avatar_url: string | null;
      }[];
    }>(
      `
    SELECT
      provider,
      provider_email,
      provider_display_name,
      provider_avatar_url
    FROM user_providers
    WHERE user_id = :userId
    `,
      { userId }
    );

    return rows.map((p) => ({
      provider: p.provider,
      email: p.provider_email,
      displayName: p.provider_display_name,
      avatarUrl: p.provider_avatar_url
    }));
  }

  async findUserByProvider(provider: Provider, providerUserId: string, trx?: Knex.Transaction) {
    const executor = trx ?? db;
    const { rows } = await executor.raw<{
      rows: UserDetailRow[];
    }>(
      `
    SELECT u.id, u.email, u.password_hash, u.role, u.status, u.display_name
    FROM user_providers p
    JOIN users u ON u.id = p.user_id
    WHERE p.provider = :provider
      AND p.provider_user_id = :providerUserId
    `,
      { provider, providerUserId }
    );

    return rows[0] ?? null;
  }

  async insertUserWithRole(
    trx: Knex.Transaction,
    data: {
      email: string;
      passwordHash: string | null;
      displayName: string | null;
      role: UserRole;
      status: UserStatus;
    }
  ): Promise<UserDetailRow> {
    const { rows } = await trx.raw<{
      rows: UserDetailRow[];
    }>(
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
    :role,
    :status,
    :displayName
  )
  RETURNING id, email, password_hash, role, status, display_name
`,
      {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        status: data.status,
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

  async updateUserEmail(trx: Knex.Transaction, userId: number, email: string) {
    await trx.raw(
      `
    UPDATE users
    SET email = :email
    WHERE id = :userId
    `,
      { userId, email }
    );
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

  async insertPendingVerification(
    trx: Knex.Transaction,
    data: {
      email: string;
      tokenHash: string;
      type: VerificationType;
      expiresAt: Date;
      userId?: number | null;
    }
  ) {
    await trx.raw(
      `
  INSERT INTO pending_verifications (
    user_id,
    email,
    token_hash,
    type,
    expires_at
  )
  VALUES (
    :userId,
    :email,
    :tokenHash,
    :type,
    :expiresAt
  )
  `,
      {
        userId: data.userId ?? null,
        email: data.email,
        tokenHash: data.tokenHash,
        type: data.type,
        expiresAt: data.expiresAt
      }
    );
  }

  async findPendingVerification(trx: Knex.Transaction, tokenHash: string, type: VerificationType) {
    const { rows } = await trx.raw<{
      rows: Array<{ id: number; user_id: number; email: string; expires_at: Date; used_at: Date | null; type: VerificationType }>;
    }>(
      `
    SELECT id, user_id, email, expires_at, used_at, type
      FROM pending_verifications
    WHERE token_hash = :tokenHash
      AND type = :type
    FOR UPDATE
    `,
      { tokenHash, type }
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

  async deletePendingByEmailAndType(trx: Knex.Transaction, email: string, type: VerificationType) {
    await trx.raw(
      `
    DELETE FROM pending_verifications
    WHERE email = :email
      AND type = :type
      AND used_at IS NULL
    `,
      { email, type }
    );
  }

  async deletePendingByUserAndType(trx: Knex.Transaction, userId: number, type: VerificationType) {
    await trx.raw(
      `
    DELETE FROM pending_verifications
    WHERE user_id = :userId
      AND type = :type
      AND used_at IS NULL
    `,
      { userId, type }
    );
  }

  async findRefreshTokenByHash(trx: Knex.Transaction, hash: string) {
    const { rows } = await trx.raw<{ rows: Array<{ id: number; user_id: number; expires_at: Date; revoked_at: Date | null }> }>(
      `
    SELECT id, user_id, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = :hash
      AND expires_at > NOW()
    `,
      { hash }
    );

    return rows[0] ?? null;
  }

  async findRefreshTokenByHashForUpdate(trx: Knex.Transaction, hash: string) {
    const { rows } = await trx.raw<{
      rows: Array<{
        id: number;
        user_id: number;
        expires_at: Date;
        revoked_at: Date | null;
      }>;
    }>(
      `
    SELECT id, user_id, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = :hash
    FOR UPDATE
    `,
      { hash }
    );

    return rows[0] ?? null;
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

  async insertUserProviderIfNotExists(
    trx: Knex.Transaction,
    data: {
      userId: number;
      provider: "GOOGLE";
      providerUserId: string;
      providerEmail: string | null;
      providerDisplayName: string | null;
      providerAvatarUrl: string | null;
    }
  ) {
    await trx.raw(
      `
    INSERT INTO user_providers (
      user_id,
      provider,
      provider_user_id,
      provider_email,
      provider_display_name,
      provider_avatar_url
    )
    VALUES (
      :userId,
      :provider,
      :providerUserId,
      :providerEmail,
      :providerDisplayName,
      :providerAvatarUrl
    )
    ON CONFLICT (provider, provider_user_id)
    DO UPDATE SET
      provider_email = EXCLUDED.provider_email,
      provider_display_name = EXCLUDED.provider_display_name,
      provider_avatar_url = EXCLUDED.provider_avatar_url
    WHERE
      user_providers.provider_email IS DISTINCT FROM EXCLUDED.provider_email
      OR user_providers.provider_display_name IS DISTINCT FROM EXCLUDED.provider_display_name
      OR user_providers.provider_avatar_url IS DISTINCT FROM EXCLUDED.provider_avatar_url
    `,
      data
    );
  }
}
