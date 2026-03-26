import z from "zod";

export const upsertAddressSchema = z.object({
  label: z.preprocess((val) => {
    if (val === "") return undefined;
    return val;
  }, z.string().max(50).optional()),
  recipientName: z.string().min(1, "Recipient name is required").max(120),
  phone: z.string().min(8, "Phone must be at least 8 digits").max(30).regex(/^\d+$/, "Phone must contain only numbers"),
  addressLine: z.string().min(5, "Address line must be at least 5 characters").max(255, "Address line too long"),

  shippingProvinceId: z.coerce.number().int().positive(),
  shippingCityId: z.coerce.number().int().positive(),
  shippingDistrictId: z.coerce.number().int().positive(),
  postalCode: z.preprocess((val) => {
    if (val === "") return undefined;
    return val;
  }, z.string().length(5, "Postal code must be exactly 5 digits").regex(/^\d+$/, "Postal code must be numeric").optional()),
  isDefault: z.boolean().optional()
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Display Name must be at least 2 characters").max(120)
});

export const addressIdParamsSchema = z.object({
  addressId: z.coerce.number().int().positive()
});

export type UpsertAddressInput = z.infer<typeof upsertAddressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
