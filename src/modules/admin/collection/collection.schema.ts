import z from "zod";

const MAX_NAME = 100;
const MAX_SLUG = 255;
const MAX_DESCRIPTION = 1000;

export const collectionUpsertSchema = z.object({
  name: z.string().min(1).max(MAX_NAME).meta({
    example: "New Arrivals"
  }),

  slug: z.string().min(1).max(MAX_SLUG).optional().meta({
    example: "new-arrivals"
  }),

  description: z.string().min(1).max(MAX_DESCRIPTION).optional().meta({
    example: "Latest products added to the store"
  }),

  status: z.enum(["ACTIVE", "INACTIVE"]).meta({
    example: "ACTIVE"
  })
});

export const collectionIdParams = z.object({
  collectionId: z.coerce.number()
});

export const collectionReorderSchema = z
  .array(
    z.object({
      id: z.number().positive().meta({
        example: 9,
        description: "Collection ID"
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
      { id: 9, sortOrder: 10 },
      { id: 6, sortOrder: 20 }
    ],
    description: "List of collections with updated sort order"
  });

export type CollectionUpsertSchema = z.infer<typeof collectionUpsertSchema>;
export type CollectionReorderSchema = z.infer<typeof collectionReorderSchema>;
