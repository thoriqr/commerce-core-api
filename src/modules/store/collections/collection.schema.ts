import z from "zod";

export const collectionSlugParams = z.object({
  slug: z.string().min(1)
});
