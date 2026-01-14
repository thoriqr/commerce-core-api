import z from "zod";

export const createProduct = z.object({
  name: z.coerce.string(),
  slug: z.coerce.string(),
  description: z.coerce.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  isVariant: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        price: z.coerce.number().int().positive(),
        stock: z.coerce.number().int().nonnegative(),
        weight: z.coerce.number().positive(),
        sku: z.string().optional(),
        isPrimary: z.coerce.boolean(),
        options: z
          .array(
            z.object({
              name: z.string(),
              value: z.string()
            })
          )
          .optional()
      })
    )
    .min(1)
});

export const productIdParams = z.object({
  productId: z.coerce.number()
});

export type CreateProductSchema = z.infer<typeof createProduct>;
