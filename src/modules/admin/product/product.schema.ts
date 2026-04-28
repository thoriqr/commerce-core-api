import z from "zod";
import { ALLOWED_IMG_FORMAT, ALLOWED_TYPES, UPLOAD_FILE, VARIANT_LIMITS } from "./product.constants";
import { PRODUCT_LIMITS } from "@/shared/product/product.constants";

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
          hexColor: z.preprocess(
            (val) => {
              if (typeof val !== "string") return undefined;
              const trimmed = val.trim();
              return trimmed === "" ? undefined : trimmed;
            },
            z
              .string()
              .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
              .optional()
          ),
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
  id: z.coerce.number().int().positive().optional(),
  clientId: z.string().min(1),
  price: z.coerce.number().int().positive().min(PRODUCT_LIMITS.PRICE_MIN).max(PRODUCT_LIMITS.PRICE_MAX),
  stock: z.coerce.number().int().min(0).max(PRODUCT_LIMITS.STOCK_MAX),
  weight: z.coerce.number().positive().min(PRODUCT_LIMITS.WEIGHT_MIN).max(PRODUCT_LIMITS.WEIGHT_MAX),
  sku: z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().max(PRODUCT_LIMITS.MAX_SKU).optional()),
  status: z.enum(["ACTIVE", "INACTIVE"]),
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
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
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

    variants.forEach((v, vIdx) => {
      // ACTIVE variant must have stock > 0
      if (v.status === "ACTIVE" && v.stock <= 0) {
        ctx.addIssue({
          path: ["variants", vIdx, "stock"],
          message: "Active variant must have stock greater than 0",
          code: "custom"
        });
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
    q: z.string().trim().min(1).optional().meta({
      example: "hoodie",
      description: "Search keyword"
    }),

    page: z.coerce.number().min(1).default(1).meta({
      example: 1
    }),

    limit: z.coerce.number().min(1).max(100).default(10).meta({
      example: 10
    }),

    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional().meta({
      example: "ACTIVE"
    }),

    isVariant: z.coerce.boolean().optional().meta({
      example: true
    }),

    stock: z.enum(["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"]).optional().meta({
      example: "IN_STOCK"
    }),

    priceMin: z.coerce.number().min(0).max(PRODUCT_LIMITS.PRICE_MAX).optional().meta({
      example: 100000
    }),

    priceMax: z.coerce.number().min(0).max(PRODUCT_LIMITS.PRICE_MAX).optional().meta({
      example: 500000
    }),

    sortBy: z.enum(["created_at", "name", "price", "stock"]).default("created_at").meta({
      example: "created_at"
    }),

    sortDir: z.enum(["asc", "desc"]).default("desc").meta({
      example: "desc"
    })
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
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).meta({
    example: "INACTIVE",
    description: "New status to apply to selected products"
  }),

  productIds: z
    .array(z.number())
    .min(1)
    .meta({
      example: [1, 2, 3],
      description: "List of product IDs to update"
    })
});

export type ProductUpsertSchema = z.infer<typeof productUpsertSchema>;
export type ProductImageSchema = z.infer<typeof productImageSchema>;
export type ProductQueryParamsSchema = z.infer<typeof productQueryParams>;
export type VariantSchema = z.infer<typeof variantSchema>;
export type VariantDimensionSchema = z.infer<typeof variantDimensionSchema>;
export type UpdateProductStatusSchema = z.infer<typeof updateProductStatusSchema>;

// FOR DOCS

export const productResponseExample = {
  productId: "78",
  name: "Basic T-Shirt",
  description: "Comfortable cotton t-shirt",
  isVariant: true,
  status: "ACTIVE",
  categoryId: "10",
  collectionIds: ["1", "2"],

  images: [
    {
      id: "101",
      imageKey: "products/main-image.webp",
      sortOrder: 1
    }
  ],

  variantDimension: [
    {
      id: "color",
      name: "Color",
      options: [
        {
          id: "red",
          value: "Red",
          hexColor: "#FF0000"
        },
        {
          id: "blue",
          value: "Blue",
          hexColor: "#0000FF"
        }
      ]
    }
  ],

  variants: [
    {
      id: 1,
      clientId: "1",
      price: 100000,
      stock: 10,
      weight: 300,
      sku: "TS-RED",
      isPrimary: true,
      status: "ACTIVE",
      options: [{ dimensionId: "color", optionId: "red" }]
    },
    {
      id: 2,
      clientId: "2",
      price: 100000,
      stock: 8,
      weight: 300,
      sku: "TS-BLUE",
      isPrimary: false,
      status: "ACTIVE",
      options: [{ dimensionId: "color", optionId: "blue" }]
    }
  ]
};

export const productUpsertExample = {
  name: "T-Shirt Basic",
  description: "Comfortable cotton t-shirt",
  status: "ACTIVE",
  categoryId: 1,
  collectionIds: [1, 2],

  images: [
    {
      sortOrder: 0,
      originalFileName: "main.jpg"
    }
  ],

  variantDimension: [
    {
      id: "color",
      name: "Color",
      options: [
        { id: "red", value: "Red", hexColor: "#FF0000" },
        { id: "blue", value: "Blue", hexColor: "#0000FF" }
      ]
    },
    {
      id: "size",
      name: "Size",
      options: [
        { id: "m", value: "M" },
        { id: "l", value: "L" }
      ]
    }
  ],

  variants: [
    {
      clientId: "temp-1",
      price: 100000,
      stock: 10,
      status: "ACTIVE",
      isPrimary: true,
      options: [
        { dimensionId: "color", optionId: "red" },
        { dimensionId: "size", optionId: "m" }
      ]
    },
    {
      clientId: "temp-2",
      price: 100000,
      stock: 8,
      status: "ACTIVE",
      isPrimary: false,
      options: [
        { dimensionId: "color", optionId: "red" },
        { dimensionId: "size", optionId: "l" }
      ]
    },
    {
      clientId: "temp-3",
      price: 100000,
      stock: 6,
      status: "ACTIVE",
      isPrimary: false,
      options: [
        { dimensionId: "color", optionId: "blue" },
        { dimensionId: "size", optionId: "m" }
      ]
    },
    {
      clientId: "temp-4",
      price: 100000,
      stock: 5,
      status: "ACTIVE",
      isPrimary: false,
      options: [
        { dimensionId: "color", optionId: "blue" },
        { dimensionId: "size", optionId: "l" }
      ]
    }
  ]
};
const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

export const upsertProductRequestSchema = z.object({
  payload: z.string().meta({
    description: `
JSON stringified product payload.

### Structure overview

- \`name\`: string
- \`description\`: string
- \`status\`: ACTIVE | INACTIVE | ARCHIVED
- \`categoryId\`: number
- \`collectionIds\`: number[]

- \`images\`: array of product images (min 1 required)
- \`variants\`: array of variants (must have exactly one primary)
- \`variantDimension\`: variant dimensions and options

### Important rules

Product must have at least one image.  
Exactly one variant must be marked as isPrimary.  
If product is ACTIVE, the primary variant must also be ACTIVE.  
Variant product must have options.  
Single product must not have options.

### Example (before stringify)

\`\`\`json
${JSON.stringify(productUpsertExample, null, 2)}
\`\`\`

### Example usage

\`\`\`js
formData.append("payload", JSON.stringify(product));
\`\`\`
`
  }),

  productImages: z
    .array(
      z
        .file()
        .max(UPLOAD_FILE.PRODUCT_FILE_SIZE)
        .mime([...ALLOWED_TYPES])
    )
    .max(UPLOAD_FILE.MAX_PRODUCT_IMG)
    .meta({
      description: `
Product images (max ${UPLOAD_FILE.MAX_PRODUCT_IMG} files).

Accepts multiple files
Supported formats: ${ALLOWED_IMG_FORMAT.join(", ")}
Max size: ${bytesToMB(UPLOAD_FILE.PRODUCT_FILE_SIZE)}MB per file

Example:
Use multiple form-data fields with the same name:

\`\`\`
productImages: file1.jpg
productImages: file2.png
\`\`\`
`
    }),

  variantImages: z
    .array(
      z
        .file()
        .max(UPLOAD_FILE.PRODUCT_FILE_SIZE)
        .mime([...ALLOWED_TYPES])
    )
    .max(UPLOAD_FILE.MAX_VARIANT_IMG)
    .optional()
    .meta({
      description: `
Variant images (optional, max ${UPLOAD_FILE.MAX_VARIANT_IMG} files).

Accepts multiple files
Same behavior as \`productImages\`

\`\`\`
variantImages: variant1.jpg
variantImages: variant2.png
\`\`\`
`
    })
});
