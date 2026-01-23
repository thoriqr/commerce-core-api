import z from "zod";

export const VARIANT_LIMITS = {
  MAX_DIMENSIONS: 2,

  // per dimension
  MAX_OPTIONS_PER_DIMENSION: 10,

  // global safeguard
  MAX_TOTAL_VARIANTS: 100
} as const;

const idSchema = z.string().min(1);

const imageSchema = z.object({
  id: z.string().optional(), // product_variant_images.id
  originalFileName: z.string().optional()
});

const variantDimensionSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1),
    options: z
      .array(
        z.object({
          id: idSchema,
          value: z.string().trim().min(1),
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
  price: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().positive(),
  weight: z.coerce.number().positive(),
  sku: z.string(),
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
    name: z.coerce.string().min(1, { error: "Product name min 2 chars" }),
    description: z.coerce.string(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    isVariant: z.boolean().optional(),
    variants: z.array(variantSchema).min(1).max(VARIANT_LIMITS.MAX_TOTAL_VARIANTS),
    variantDimension: z.array(variantDimensionSchema).max(VARIANT_LIMITS.MAX_DIMENSIONS)
  })
  .superRefine((data, ctx) => {
    const dims = data.variantDimension;
    const variants = data.variants;
    const dimIds = dims.map((d) => d.id);

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

export const productQueryParams = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  isVariant: z.coerce.boolean().optional(),
  stock: z.enum(["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"]).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["created_at", "name", "price", "stock"]).default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc")
});

export type ProductUpsertSchema = z.infer<typeof productUpsertSchema>;
export type ProductQueryParamsSchema = z.infer<typeof productQueryParams>;
export type VariantSchema = z.infer<typeof variantSchema>;
export type VariantDimensionSchema = z.infer<typeof variantDimensionSchema>;
