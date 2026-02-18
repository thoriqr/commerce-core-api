import z from "zod";

export const categorySlugPathQueryParams = z.object({
  slugPath: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, "Invalid slug path format")
});

export const categoryQueryParams = categorySlugPathQueryParams
  .extend({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    sortBy: z.enum(["created_at", "price"]).default("created_at"),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .refine((data) => !data.priceMin || !data.priceMax || data.priceMin <= data.priceMax, {
    message: "priceMin must be less than or equal to priceMax"
  });
