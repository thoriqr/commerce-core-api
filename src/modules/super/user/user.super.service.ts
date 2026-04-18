import { UserSuperRepo } from "./user.super.repo";
import { AppError } from "@/errors/app-error";
import { UserSuperQuery } from "./user.super.schema";

export class UserSuperService {
  constructor(private readonly userSuperRepo: UserSuperRepo) {}

  getUsers = async (params: UserSuperQuery) => {
    const [rows, total] = await Promise.all([this.userSuperRepo.getUsers(params), this.userSuperRepo.getCount(params)]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        email: r.email,
        status: r.status,
        role: r.role,
        isDemo: r.is_demo,
        createdAt: r.created_at
      })),
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasNext: params.page * params.limit < total,
        hasPrev: params.page > 1
      }
    };
  };

  revokeUserSessions = async (userId: number) => {
    const user = await this.userSuperRepo.findUserById(userId);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    await this.userSuperRepo.revokeUserSessions(userId);
  };
}
