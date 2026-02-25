import z from "zod";

import { categorySlugPathQueryParams } from "../categories/category.schema";
import { PRODUCT_LIMITS } from "@/shared/product/product.constants";

export const baseQueryParams = z
  .object({
    cursor: z.string().optional(),

    limit: z.coerce.number().min(1).max(50).default(12),

    priceMin: z.coerce.number().min(0).max(PRODUCT_LIMITS.PRICE_MAX).optional(),
    priceMax: z.coerce.number().min(0).max(PRODUCT_LIMITS.PRICE_MAX).optional(),

    sortBy: z.enum(["created_at", "price"]).default("created_at"),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .refine((data) => data.priceMin === undefined || data.priceMax === undefined || data.priceMin <= data.priceMax, {
    message: "priceMin must be less than or equal to priceMax"
  });

export const productByCategoryQueryParams = z
  .looseObject({
    slugPath: categorySlugPathQueryParams.shape.slugPath,
    ...baseQueryParams.shape
  })
  .refine((data) => data.priceMin === undefined || data.priceMax === undefined || data.priceMin <= data.priceMax, {
    message: "priceMin must be less than or equal to priceMax"
  });

export const productByCollectionQueryParams = baseQueryParams.extend({
  slug: z.string().min(1)
});

export const productBySearchQueryParams = baseQueryParams.extend({
  q: z.string().min(1)
});

export const productSlugParams = z.object({
  slug: z.string().trim().min(1)
});

export const productVariantIdParams = z.object({
  productSlug: z.string().trim().min(1),
  variantId: z.coerce.number().int().positive()
});

export type BaseQueryParams = z.infer<typeof baseQueryParams>;
export type ProductByCategoryQueryParams = z.infer<typeof productByCategoryQueryParams>;
export type ProductByCollectionQueryParams = z.infer<typeof productByCollectionQueryParams>;
export type ProductBySearchQueryParams = z.infer<typeof productBySearchQueryParams>;
