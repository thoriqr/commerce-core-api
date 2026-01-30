import z from "zod";

export const categoryUpsertSchema = z.object({
  parentId: z.number().positive().nullable(),
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional()
});

export const categoryParentIdParams = z.object({
  parentId: z.coerce.number()
});

export const categoryIdParams = z.object({
  categoryId: z.coerce.number()
});

export type CategoryUpsertSchema = z.infer<typeof categoryUpsertSchema>;
