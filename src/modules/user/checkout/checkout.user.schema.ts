import { SUPPORTED_COURIERS } from "@/shared/shipping/shipping.constants";
import z from "zod";

export const sessionIdParams = z.object({
  sessionId: z.coerce.number().int().positive()
});

export const checkoutSessionParamsSchema = z.object({
  sessionId: z.coerce.number().int().positive()
});

export const setCheckoutAddressSchema = z.object({
  addressId: z.coerce.number().int().positive().meta({
    description: "Selected address ID for this checkout session",
    example: 1
  })
});

export const calculateShippingSchema = z.object({
  courier: z.enum(SUPPORTED_COURIERS).meta({
    description: "Courier provider code",
    example: "jne"
  })
});

export const setShippingMethodSchema = z.object({
  courierCode: z.enum(SUPPORTED_COURIERS).meta({
    description: "Courier provider code",
    example: "jne"
  }),

  courierService: z.string().min(1).meta({
    description: "Selected courier service code from available options",
    example: "REG"
  })
});
