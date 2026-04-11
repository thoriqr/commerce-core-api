import { z } from "zod";

export const userAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().trim().min(1).optional()
});

export type UserAdminQuery = z.infer<typeof userAdminQuerySchema>;
