import z from "zod";

export const ordersByUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(50).default(10),

  status: z.enum(["ongoing", "completed", "cancelled"]).optional()
});

export const orderCodeParams = z.object({
  orderCode: z.string().min(1).max(50)
});

export type GetOrdersByUserParams = z.infer<typeof ordersByUserQuerySchema>;
