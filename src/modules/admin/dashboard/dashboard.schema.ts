import z from "zod";

export const getDashboardSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export type GetDashboardInput = z.infer<typeof getDashboardSchema>;
