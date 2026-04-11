import { z } from "zod";

const roles = ["USER", "ADMIN", "SUPER"] as const;

export const userSuperQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(50).default(10),

  search: z.string().trim().min(1).optional(),

  role: z.enum(roles).optional()
});

export const userIdParams = z.object({
  userId: z.coerce.number().positive().min(1)
});

export type UserSuperQuery = z.infer<typeof userSuperQuerySchema>;
