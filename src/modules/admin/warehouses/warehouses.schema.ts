import z from "zod";

export const upsertWarehousesSchema = z.object({
  name: z.string().min(1).max(100),
  shippingProvinceId: z.coerce.number().int().positive(),
  shippingCityId: z.coerce.number().int().positive()
});

export type UpsertWarehouseInput = z.infer<typeof upsertWarehousesSchema>;
