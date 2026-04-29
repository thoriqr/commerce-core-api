import z from "zod";

export const upsertWarehousesSchema = z.object({
  name: z.string().min(1).max(100).meta({
    description: "Warehouse name",
    example: "Main Warehouse"
  }),

  shippingProvinceId: z.coerce.number().int().positive().meta({
    description: "Province ID for shipping origin",
    example: 18
  }),

  shippingCityId: z.coerce.number().int().positive().meta({
    description: "City ID for shipping origin",
    example: 577
  }),

  shippingDistrictId: z.coerce.number().int().positive().meta({
    description: "District ID for shipping origin",
    example: 5874
  }),

  postalCode: z
    .preprocess((val) => {
      if (val === "") return undefined;
      return val;
    }, z.string().length(5, "Postal code must be exactly 5 digits").regex(/^\d+$/, "Postal code must be numeric").optional())
    .meta({
      description: "Postal code (5 digits)",
      example: "60195"
    })
});

export type UpsertWarehouseInput = z.infer<typeof upsertWarehousesSchema>;
