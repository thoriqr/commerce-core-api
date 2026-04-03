import z from "zod";

const MAX_NAME = 100;
const MAX_SLUG = 255;
const MAX_DESCRIPTION = 1000;

export const collectionUpsertSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  slug: z.string().min(1).max(MAX_SLUG).optional(),
  description: z.string().min(1).max(MAX_DESCRIPTION).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

export const collectionIdParams = z.object({
  collectionId: z.coerce.number()
});

export const collectionReorderSchema = z
  .array(
    z.object({
      id: z.number().positive(),
      sortOrder: z.number().positive()
    })
  )
  .min(1);

export type CollectionUpsertSchema = z.infer<typeof collectionUpsertSchema>;
export type CollectionReorderSchema = z.infer<typeof collectionReorderSchema>;
