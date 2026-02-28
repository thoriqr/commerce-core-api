import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { UserDetailRow, UserRow } from "./auth.repo.types";

export class AuthRepo {
  async findRefreshTokenByHash(trx: Knex.Transaction, hash: string) {}

  async revokeRefreshToken(trx: Knex.Transaction, tokenId: number) {}

  async revokeAllUserRefreshTokens(trx: Knex.Transaction, userId: number) {}

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

  async findUserById(userId: number) {
    const { rows } = await db.raw<{ rows: UserRow[] }>(
      `
    SELECT id, email, role, display_name
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
}
