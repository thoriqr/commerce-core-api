import z from "zod";

const MAX_NAME = 100;
const MAX_SLUG = 255;
const MAX_DESCRIPTION = 1000;

export const categoryUpsertSchema = z.object({
  parentId: z.number().positive().nullable(),
  name: z.string().min(1).max(MAX_NAME),
  slug: z.string().min(1).max(MAX_SLUG).optional(),
  description: z.string().min(1).max(MAX_DESCRIPTION).optional(),
  isActive: z.boolean().default(true)
});

export const categoryReorderSchema = z
  .array(
    z.object({
      id: z.number().positive(),
      sortOrder: z.number().positive()
    })
  )
  .min(1);

export const categoryParentIdParams = z.object({
  parentId: z.coerce.number()
});

export const categoryIdParams = z.object({
  categoryId: z.coerce.number()
});

export type CategoryUpsertSchema = z.infer<typeof categoryUpsertSchema>;
export type CategoryReorderSchema = z.infer<typeof categoryReorderSchema>;
