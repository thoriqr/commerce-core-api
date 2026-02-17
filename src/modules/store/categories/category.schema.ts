import z from "zod";

export const categorySlugPathQueryParams = z.object({
  slugPath: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, "Invalid slug path format")
});
