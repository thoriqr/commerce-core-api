import z from "zod";

import { categorySlugPathQueryParams } from "../categories/category.schema";

export const productByCategoryQueryParams = z
  .looseObject({
    slugPath: categorySlugPathQueryParams.shape.slugPath,

    cursor: z.string().optional(),

    limit: z.coerce.number().min(1).max(50).default(12),

    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),

    sortBy: z.enum(["created_at", "price"]).default("created_at"),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .refine((data) => data.priceMin === undefined || data.priceMax === undefined || data.priceMin <= data.priceMax, {
    message: "priceMin must be less than or equal to priceMax"
  });

export type ProductByCategoryQueryParams = z.infer<typeof productByCategoryQueryParams>;
