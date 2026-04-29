import z from "zod";
import { VARIANT_LIMITS } from "../product/product.constants";

const MAX_VALUES = 20;

export const presetDimensionValueSchema = z.object({
  name: z.string().trim().min(VARIANT_LIMITS.OPTION_VALUE_MIN).max(VARIANT_LIMITS.OPTION_VALUE_MAX).meta({
    description: "Option value name",
    example: "Red"
  }),

  hexColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional()
    .meta({
      description: "Optional hex color (for color-type dimensions)",
      example: "#FF0000"
    })
});

export const presetDimensionUpsertSchema = z.object({
  name: z.string().trim().min(VARIANT_LIMITS.DIMENSION_NAME_MIN).max(VARIANT_LIMITS.DIMENSION_NAME_MAX).meta({
    description: "Dimension name",
    example: "Color"
  }),

  values: z
    .array(presetDimensionValueSchema)
    .min(1)
    .max(MAX_VALUES)
    .meta({
      description: "List of dimension values",
      example: [
        { name: "Red", hexColor: "#FF0000" },
        { name: "Blue", hexColor: "#0000FF" }
      ]
    })
});
export const presetDimensionValueReorderSchema = z
  .array(
    z.object({
      id: z.number().positive(),
      sortOrder: z.number().positive()
    })
  )
  .min(1);

export const presetDimensionIdParams = z.object({ dimensionPresetId: z.coerce.number() });
export const presetDimensionNameParams = z.object({
  dimensionPresetName: z.string().max(VARIANT_LIMITS.DIMENSION_NAME_MAX).meta({
    example: "color",
    description: "Dimension preset name (e.g. color, size)"
  })
});

export type PresetDimensionUpsertSchema = z.infer<typeof presetDimensionUpsertSchema>;
export type PresetDimensionValueSchema = z.infer<typeof presetDimensionValueSchema>;
export type PresetDimensionValueReorderSchema = z.infer<typeof presetDimensionValueReorderSchema>;
