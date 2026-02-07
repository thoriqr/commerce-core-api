import { BANNER_PLACEMENT, BANNER_TARGET_TYPE } from "./banner.constants";

export type BannerPlacement = (typeof BANNER_PLACEMENT)[keyof typeof BANNER_PLACEMENT];
export type BannerTargetType = (typeof BANNER_TARGET_TYPE)[keyof typeof BANNER_TARGET_TYPE];

export type BannerListRow = {
  id: number;
  title: string;
  placement: BannerPlacement;
  image_key: string;
  target_type: BannerTargetType;
  target_value: string;
  is_active: boolean;
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
  is_active: boolean;
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
