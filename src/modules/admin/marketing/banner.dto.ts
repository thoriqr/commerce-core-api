import { BannerPlacement, BannerStatus, BannerTargetType } from "./banner.types";

export interface BannerListDTO {
  id: number;
  title: string;
  placement: BannerPlacement;
  imageKey: string;
  targetType: BannerTargetType;
  targetValue: string;
  status: BannerStatus;
  sortOrder: number;
}

export interface BannerDetailDTO {
  id: number;
  title: string;
  placement: BannerPlacement;
  image: { id: string; imageKey: string };
  targetType: BannerTargetType;
  targetId: string;
  status: BannerStatus;
}

export interface BannerImageDTO {
  id: number;
  imageKey: string;
  width: number;
  height: number;
}
