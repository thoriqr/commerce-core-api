import { BannerPlacement, BannerTargetType } from "./banner.types";

export interface BannerListDTO {
  id: number;
  title: string;
  placement: BannerPlacement;
  imageKey: string;
  targetType: BannerTargetType;
  targetValue: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BannerDetailDTO {
  id: number;
  title: string;
  placement: BannerPlacement;
  image: { id: string; imageKey: string };
  targetType: BannerTargetType;
  targetId: string;
  isActive: boolean;
}
