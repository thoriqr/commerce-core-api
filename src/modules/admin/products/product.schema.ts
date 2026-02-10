import z from "zod";
import { PRODUCT_LIMITS, VARIANT_LIMITS } from "./product.constants";

const idSchema = z.string().min(1);

const imageSchema = z.object({
  id: z.string().optional(), // product_variant_images.id
  originalFileName: z.string().optional()
});

const productImageSchema = imageSchema.extend({ sortOrder: z.coerce.number().int().nonnegative() });

const variantDimensionSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(VARIANT_LIMITS.DIMENSION_NAME_MIN).max(VARIANT_LIMITS.DIMENSION_NAME_MAX),
    options: z
      .array(
        z.object({
          id: idSchema,
          value: z.string().trim().min(VARIANT_LIMITS.OPTION_VALUE_MIN).max(VARIANT_LIMITS.OPTION_VALUE_MAX),
          image: imageSchema.optional()
        })
      )
      .max(VARIANT_LIMITS.MAX_OPTIONS_PER_DIMENSION)
  })
  .superRefine((dim, ctx) => {
    const optMap = new Map<string, number[]>();

    dim.options.forEach((opt, optIdx) => {
      const key = opt.value.toLowerCase();

      const arr = optMap.get(key) ?? [];
      arr.push(optIdx);
      optMap.set(key, arr);
    });

    for (const [, indices] of optMap) {
      if (indices.length > 1) {
        indices.forEach((i) => {
          ctx.addIssue({
            path: ["options", i, "value"],
            message: "Option value must be unique within this dimension",
            code: "custom"
          });
        });
      }
    }
  });

const variantSchema = z.object({
  id: idSchema,
  price: z.coerce.number().int().positive().min(PRODUCT_LIMITS.PRICE_MIN).max(PRODUCT_LIMITS.PRICE_MAX),
  stock: z.coerce.number().int().positive().min(PRODUCT_LIMITS.STOCK_MIN).max(PRODUCT_LIMITS.STOCK_MAX),
  weight: z.coerce.number().positive().min(PRODUCT_LIMITS.WEIGHT_MIN).max(PRODUCT_LIMITS.WEIGHT_MAX),
  sku: z.string().max(PRODUCT_LIMITS.MAX_SKU),
  isPrimary: z.boolean(),
  options: z.array(
    z.object({
      dimensionId: idSchema,
      optionId: idSchema
    })
  )
});

export const productUpsertSchema = z
  .object({
    name: z.coerce.string().min(PRODUCT_LIMITS.NAME_MIN).max(PRODUCT_LIMITS.NAME_MAX),
    description: z.coerce.string().min(PRODUCT_LIMITS.DESCRIPTION_MIN).max(PRODUCT_LIMITS.DESCRIPTION_MAX),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    categoryId: z.coerce.number().int().positive(),
    collectionIds: z.array(z.coerce.number().int().positive()),
    isVariant: z.boolean().optional(),
    images: z.array(productImageSchema, { error: "Images is required" }).min(1).max(PRODUCT_LIMITS.IMAGE_LIMIT),
    variants: z.array(variantSchema).min(1).max(VARIANT_LIMITS.MAX_TOTAL_VARIANTS),
    variantDimension: z.array(variantDimensionSchema).max(VARIANT_LIMITS.MAX_DIMENSIONS)
  })
  .superRefine((data, ctx) => {
    const dims = data.variantDimension;
    const variants = data.variants;
    const dimIds = dims.map((d) => d.id);

    const sortOrders = data.images.map((img) => img.sortOrder);
    const uniqueSortOrders = new Set(sortOrders);

    if (uniqueSortOrders.size !== sortOrders.length) {
      ctx.addIssue({
        path: ["images"],
        message: "Image sortOrder must be unique",
        code: "custom"
      });
    }

    if (variants.length === 1 && dims.length > 0) {
      ctx.addIssue({
        path: ["variantDimensions"],
        message: "variantDimensions are not allowed when only one variant exists",
        code: "custom"
      });
    }
    // VARIANT PRODUCT MUST HAVE DIMENSIONS
    if (variants.length > 1 && dims.length === 0) {
      ctx.addIssue({
        path: ["variantDimension"],
        message: "Variant dimensions are required when multiple variants exist",
        code: "custom"
      });
    }

    variants.forEach((v, vIdx) => {
      if (v.options.length !== dimIds.length) {
        ctx.addIssue({
          path: ["variants", vIdx, "options"],
          message: "Variant options must match variant dimensions",
          code: "custom"
        });
      }
    });

    // DUPLICATE DIM ID VARIANTS
    variants.forEach((variant, vIdx) => {
      const dimIdMap = new Map<string, number[]>();

      variant.options.forEach((opt, optIdx) => {
        const key = opt.dimensionId;
        const arr = dimIdMap.get(key) ?? [];
        arr.push(optIdx);
        dimIdMap.set(key, arr);
      });

      for (const [, indices] of dimIdMap) {
        if (indices.length > 1) {
          indices.forEach((i) => {
            ctx.addIssue({
              path: ["variants", vIdx, "options", i, "dimensionId"],
              message: "Each variant must select only one option per dimension",
              code: "custom"
            });
          });
        }
      }
    });

    // DUPLICATE ACROSS DIMENSION NAME
    const dimNameMap = new Map<string, number[]>();

    dims.forEach((dim, dimIdx) => {
      const key = dim.name.toLowerCase();
      const arr = dimNameMap.get(key) ?? [];
      arr.push(dimIdx);
      dimNameMap.set(key, arr);
    });

    for (const [, indices] of dimNameMap) {
      if (indices.length > 1) {
        indices.forEach((i) => {
          ctx.addIssue({
            path: ["variantDimension", i, "name"],
            message: "Dimension name must be unique",
            code: "custom"
          });
        });
      }
    }
  });

export const productIdParams = z.object({
  productId: z.coerce.number()
});

export const productQueryParams = z
  .object({
    q: z.string().trim().min(1).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    isVariant: z.coerce.boolean().optional(),
    stock: z.enum(["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"]).optional(),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    sortBy: z.enum(["created_at", "name", "price", "stock"]).default("created_at"),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .superRefine((data, ctx) => {
    if (data.priceMin !== undefined && data.priceMax !== undefined && data.priceMin > data.priceMax) {
      ctx.addIssue({
        path: ["priceMin"],
        code: "custom",
        message: "priceMin cannot be greater than priceMax"
      });
    }
  });

export const updateProductStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
  productIds: z.array(z.number()).min(1)
});

export type ProductUpsertSchema = z.infer<typeof productUpsertSchema>;
export type ProductImageSchema = z.infer<typeof productImageSchema>;
export type ProductQueryParamsSchema = z.infer<typeof productQueryParams>;
export type VariantSchema = z.infer<typeof variantSchema>;
export type VariantDimensionSchema = z.infer<typeof variantDimensionSchema>;
export type UpdateProductStatusSchema = z.infer<typeof updateProductStatusSchema>;
