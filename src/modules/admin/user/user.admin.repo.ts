import { db } from "@/infra/db/knex";
import { UserAdminQuery } from "./user.admin.schema";

export class UserAdminRepo {
  async getUsers(params: UserAdminQuery) {
    const { page, limit, search } = params;

    const offset = (page - 1) * limit;

    const conditions: string[] = [`role = 'USER'`];
    const bindings: Record<string, any> = {
      limit,
      offset
    };

    if (search) {
      conditions.push(`email ILIKE :search`);
      bindings.search = `%${search}%`;
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const { rows } = await db.raw<{
      rows: {
        id: number;
        email: string;
        status: string;
        created_at: Date;
      }[];
    }>(
      `
      SELECT
        id,
        email,
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

  async getCount(params: UserAdminQuery) {
    const { search } = params;

    const conditions: string[] = [`role = 'USER'`];
    const bindings: Record<string, any> = {};

    if (search) {
      conditions.push(`email ILIKE :search`);
      bindings.search = `%${search}%`;
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

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
}
