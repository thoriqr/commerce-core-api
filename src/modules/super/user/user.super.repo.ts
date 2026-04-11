import { db } from "@/infra/db/knex";
import { UserSuperQuery } from "./user.super.schema";

export class UserSuperRepo {
  async getUsers(params: UserSuperQuery) {
    const { page, limit, search, role } = params;

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const bindings: Record<string, any> = {
      limit,
      offset
    };

    if (role) {
      conditions.push(`role = :role`);
      bindings.role = role;
    }

    if (search) {
      conditions.push(`email ILIKE :search`);
      bindings.search = `%${search}%`;
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await db.raw<{
      rows: {
        id: number;
        email: string;
        role: string;
        status: string;
        created_at: Date;
      }[];
    }>(
      `
      SELECT
        id,
        email,
        role,
        status,
        created_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
      `,
      bindings
    );

    return rows;
  }

  async getCount(params: UserSuperQuery) {
    const { search, role } = params;

    const conditions: string[] = [];
    const bindings: Record<string, any> = {};

    if (role) {
      conditions.push(`role = :role`);
      bindings.role = role;
    }

    if (search) {
      conditions.push(`email ILIKE :search`);
      bindings.search = `%${search}%`;
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await db.raw<{
      rows: { count: string }[];
    }>(
      `
      SELECT COUNT(*)::int AS count
      FROM users
      ${whereSql}
      `,
      bindings
    );

    return Number(rows[0]?.count ?? 0);
  }

  async findUserById(userId: number) {
    const { rows } = await db.raw<{
      rows: {
        id: number;
        email: string;
        role: string;
        status: string;
      }[];
    }>(
      `
    SELECT id, email, role, status
    FROM users
    WHERE id = :userId
    LIMIT 1
    `,
      { userId }
    );

    return rows[0] ?? null;
  }

  async revokeUserSessions(userId: number) {
    const result = await db.raw(
      `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = :userId
    AND revoked_at IS NULL
    `,
      { userId }
    );

    return result.rowCount ?? 0;
  }
}
