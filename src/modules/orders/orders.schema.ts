import z from "zod";

export const sessionIdParams = z.object({
  sessionId: z.coerce.number().int().positive()
});

export const orderCodeParams = z.object({
  orderCode: z.string().min(1).max(50)
});
