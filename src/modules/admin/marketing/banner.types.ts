import { BannerPlacement, BannerStatus, BannerTargetType } from "@/shared/banner/banner.types";

export type BannerListRow = {
  id: number;
  title: string;
  placement: BannerPlacement;
  image_key: string;
  target_type: BannerTargetType;
  target_entity_id: number | null;
  status: BannerStatus;
  sort_order: number;
};

export type BannerResolvedRow = {
  id: number;
  title: string;
  placement: BannerPlacement;
  image_key: string;
  target_type: BannerTargetType;
  url: string;
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
  target_entity_id: number | null;
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
