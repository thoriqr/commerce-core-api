import z from "zod";
import { BANNER_PLACEMENT, BANNER_TARGET_TYPE } from "./banner.constants";

const MAX_TITLE = 100;

export const imageSchema = z.object({
  id: z.string().min(1),
  imageKey: z.string().optional(),
  previewUrl: z.string().optional(),
  originalFileName: z.string().optional()
});

export const bannerUpsertSchema = z.object({
  image: imageSchema,
  title: z.string().min(1).max(MAX_TITLE),
  placement: z.enum([BANNER_PLACEMENT.HOMEPAGE_HERO]),
  targetType: z.enum([BANNER_TARGET_TYPE.COLLECTION, BANNER_TARGET_TYPE.CATEGORY]),
  targetValue: z.coerce.number().min(1).positive(),
  isActive: z.coerce.boolean().default(true)
});

export const bannerIdParams = z.object({
  bannerId: z.coerce.number()
});

export const bannerReorderSchema = z
  .array(
    z.object({
      id: z.number().positive(),
      sortOrder: z.number().positive()
    })
  )
  .min(1);

export type BannerUpsertSchema = z.infer<typeof bannerUpsertSchema>;
export type BannerImageSchema = z.infer<typeof imageSchema>;
export type BannerReorderSchema = z.infer<typeof bannerReorderSchema>;
