import { BannerDetailDTO, BannerImageDTO, BannerListDTO } from "./banner.dto";
import { BannerDetailRow, BannerImageRow, BannerListRow } from "./banner.types";

export function mapBannerList(rows: BannerListRow[]): BannerListDTO[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    placement: r.placement,
    imageKey: r.image_key,
    targetType: r.target_type,
    targetValue: r.target_value,
    status: r.status,
    sortOrder: r.sort_order
  }));
}

export function mapBannerDetail(row: BannerDetailRow): BannerDetailDTO {
  return {
    id: row.id,
    title: row.title,
    placement: row.placement,
    image: { id: String(row.image_id), imageKey: row.image_key },
    targetType: row.target_type,
    targetId: row.target_id ? String(row.target_id) : "",
    status: row.status
  };
}

export function mapBannerImages(rows: BannerImageRow[]): BannerImageDTO[] {
  return rows.map((r) => ({
    id: r.id,
    imageKey: r.image_key,
    width: r.width,
    height: r.height
  }));
}
