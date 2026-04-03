import z from "zod";

export const sessionIdParams = z.object({
  sessionId: z.coerce.number().int().positive()
});
