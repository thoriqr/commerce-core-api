import z from "zod";

export const upsertAddressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().min(1).max(120),
  phone: z.string().min(8).max(30),
  addressLine: z.string().min(5),

  shippingProvinceId: z.coerce.number().int().positive(),
  shippingCityId: z.coerce.number().int().positive(),
  shippingDistrictId: z.coerce.number().int().positive(),
  postalCode: z.string().length(5, "Postal code must be exactly 5 digits").regex(/^\d+$/, "Postal code must be numeric").optional(),
  isDefault: z.boolean().optional()
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120)
});

export const addressIdParamsSchema = z.object({
  addressId: z.coerce.number().int().positive()
});

export type UpsertAddressInput = z.infer<typeof upsertAddressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
