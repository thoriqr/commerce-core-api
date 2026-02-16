import z from "zod";
import { BANNER_PLACEMENT } from "@/shared/banner/banner.constants";

export const bannerQueryParams = z.object({
  placement: z.enum([BANNER_PLACEMENT.HOMEPAGE_HERO])
});

export type BannerQueryParams = z.infer<typeof bannerQueryParams>;
