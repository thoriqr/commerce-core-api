import { UserAdminRepo } from "./user.admin.repo";
import { UserAdminQuery } from "./user.admin.schema";

export class UserAdminService {
  constructor(private readonly userAdminRepo: UserAdminRepo) {}

  getUsers = async (params: UserAdminQuery) => {
    const [rows, total] = await Promise.all([this.userAdminRepo.getUsers(params), this.userAdminRepo.getCount(params)]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        email: r.email,
        status: r.status,
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
}
