import { BANNER_PLACEMENT, BANNER_TARGET_TYPE } from "./banner.constants";

export type BannerPlacement = (typeof BANNER_PLACEMENT)[keyof typeof BANNER_PLACEMENT];
export type BannerTargetType = (typeof BANNER_TARGET_TYPE)[keyof typeof BANNER_TARGET_TYPE];
export type BannerStatus = "ACTIVE" | "INACTIVE";
