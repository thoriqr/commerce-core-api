import z from "zod";

export const getCitiesParamsSchema = z.object({
  provinceId: z.coerce.number().int().positive()
});

export const getDistrictsParamsSchema = z.object({
  cityId: z.coerce.number().int().positive()
});
