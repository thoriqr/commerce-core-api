import z from "zod";

const MAX_NAME = 100;
const MAX_SLUG = 255;
const MAX_DESCRIPTION = 1000;

export const categoryUpsertSchema = z.object({
  parentId: z.number().positive().nullable(),
  name: z.string().min(1).max(MAX_NAME),
  slug: z.string().min(1).max(MAX_SLUG).optional(),
  description: z.string().min(1).max(MAX_DESCRIPTION).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

export const categoryUpdateSchema = categoryUpsertSchema.omit({ parentId: true });

export const categoryReorderSchema = z
  .array(
    z.object({
      id: z.number().positive().meta({
        example: 61,
        description: "Category ID"
      }),
      sortOrder: z.number().positive().meta({
        example: 10,
        description: "New sort order position"
      })
    })
  )
  .min(1)
  .meta({
    example: [
      { id: 61, sortOrder: 10 },
      { id: 62, sortOrder: 20 },
      { id: 63, sortOrder: 30 }
    ],
    description: "List of categories with updated sort order"
  });

export const categoryParentIdParams = z.object({
  parentId: z.coerce.number()
});

export const categoryIdParams = z.object({
  categoryId: z.coerce.number()
});

export type CategoryUpsertSchema = z.infer<typeof categoryUpsertSchema>;
export type CategoryUpdateSchema = z.infer<typeof categoryUpdateSchema>;
export type CategoryReorderSchema = z.infer<typeof categoryReorderSchema>;

export const categoryUpsertExample = {
  parentId: null,
  name: "Menswear",
  slug: "menswear",
  description: "Men fashion category",
  status: "ACTIVE"
};

export const categoryChildExample = {
  parentId: 1,
  name: "Men Hoodies",
  slug: "men-hoodies",
  description: "Hoodies for men",
  status: "ACTIVE"
};
