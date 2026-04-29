import { SUPPORTED_COURIERS } from "@/shared/shipping/shipping.constants";
import z from "zod";

export const getCitiesParamsSchema = z.object({
  provinceId: z.coerce.number().int().positive()
});

export const getDistrictsParamsSchema = z.object({
  cityId: z.coerce.number().int().positive()
});

export const courierEnum = z.enum(SUPPORTED_COURIERS);

export const calculateDomesticCostSchema = z.object({
  destinationId: z.coerce.number().int().positive().meta({
    description: "Destination district ID",
    example: 5874
  }),

  weight: z.coerce.number().int().positive().meta({
    description: "Total weight in grams",
    example: 1000
  }),

  courier: courierEnum.meta({
    description: "Courier code",
    example: "jne"
  })
});
