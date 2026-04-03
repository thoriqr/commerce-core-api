import { SUPPORTED_COURIERS } from "@/shared/shipping/shipping.constants";
import z from "zod";

export const sessionIdParams = z.object({
  sessionId: z.coerce.number().int().positive()
});

export const checkoutSessionParamsSchema = z.object({
  sessionId: z.coerce.number().int().positive()
});

export const setCheckoutAddressSchema = z.object({
  addressId: z.coerce.number().int().positive()
});

export const calculateShippingSchema = z.object({
  courier: z.enum(SUPPORTED_COURIERS)
});

export const setShippingMethodSchema = z.object({
  courierCode: z.enum(SUPPORTED_COURIERS),
  courierService: z.string().min(1)
});
