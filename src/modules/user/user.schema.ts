import z from "zod";

export const upsertAddressSchema = z.object({
  label: z
    .preprocess((val) => {
      if (val === "") return undefined;
      return val;
    }, z.string().max(50).optional())
    .meta({
      description: "Address label (e.g. Home, Office)",
      example: "Home"
    }),

  recipientName: z.string().min(1).max(120).meta({
    description: "Recipient full name",
    example: "John Doe"
  }),

  phone: z.string().min(8).max(30).regex(/^\d+$/).meta({
    description: "Phone number (digits only)",
    example: "081234567890"
  }),

  addressLine: z.string().min(5).max(255).meta({
    description: "Full address line",
    example: "Jl. Contoh No. 123"
  }),

  shippingProvinceId: z.coerce.number().int().positive().meta({
    description: "Province ID",
    example: 18
  }),

  shippingCityId: z.coerce.number().int().positive().meta({
    description: "City ID",
    example: 577
  }),

  shippingDistrictId: z.coerce.number().int().positive().meta({
    description: "District ID",
    example: 5874
  }),

  postalCode: z
    .preprocess((val) => {
      if (val === "") return undefined;
      return val;
    }, z.string().length(5).regex(/^\d+$/).optional())
    .meta({
      description: "Postal code (5 digits)",
      example: "60262"
    }),

  isDefault: z.boolean().optional().meta({
    description: "Set as default address (future use)",
    example: false
  })
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Display Name must be at least 2 characters").max(120).meta({
    description: "User display name",
    example: "John Doe"
  })
});

export const addressIdParamsSchema = z.object({
  addressId: z.coerce.number().int().positive()
});

export type UpsertAddressInput = z.infer<typeof upsertAddressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
