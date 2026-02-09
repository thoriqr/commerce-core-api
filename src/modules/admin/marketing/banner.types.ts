import { BANNER_PLACEMENT, BANNER_TARGET_TYPE } from "./banner.constants";

export type BannerPlacement = (typeof BANNER_PLACEMENT)[keyof typeof BANNER_PLACEMENT];
export type BannerTargetType = (typeof BANNER_TARGET_TYPE)[keyof typeof BANNER_TARGET_TYPE];
export type BannerStatus = "ACTIVE" | "INACTIVE";

export type BannerListRow = {
  id: number;
  title: string;
  placement: BannerPlacement;
  image_key: string;
  target_type: BannerTargetType;
  target_value: string;
  status: BannerStatus;
  sort_order: number;
};

export type BannerDetailRow = {
  id: number;
  title: string;
  placement: BannerPlacement;
  image_id: number;
  image_key: string;
  target_type: BannerTargetType;
  target_id: number | null;
  status: BannerStatus;
};

export type ImagePayload = {
  imageKey: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  originalHeight: number;
  originalWidth: number;
  originalAvailable: boolean;
};

export type BannerImageRow = {
  id: number;
  image_key: string;
  width: number;
  height: number;
};
