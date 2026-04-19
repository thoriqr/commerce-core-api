import z from "zod";

export const upsertWarehousesSchema = z.object({
  name: z.string().min(1).max(100),
  shippingProvinceId: z.coerce.number().int().positive(),
  shippingCityId: z.coerce.number().int().positive(),
  shippingDistrictId: z.coerce.number().int().positive(),
  postalCode: z.preprocess((val) => {
    if (val === "") return undefined;
    return val;
  }, z.string().length(5, "Postal code must be exactly 5 digits").regex(/^\d+$/, "Postal code must be numeric").optional())
});

export type UpsertWarehouseInput = z.infer<typeof upsertWarehousesSchema>;
