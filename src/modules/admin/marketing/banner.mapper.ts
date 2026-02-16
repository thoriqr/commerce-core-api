import { BannerDetailDTO, BannerImageDTO, BannerListDTO } from "./banner.dto";
import { BannerDetailRow, BannerImageRow, BannerResolvedRow } from "./banner.types";

export function mapBannerList(rows: BannerResolvedRow[]): BannerListDTO[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    placement: r.placement,
    imageKey: r.image_key,
    targetType: r.target_type,
    url: r.url,
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
    targetId: row.target_entity_id ? String(row.target_entity_id) : "",
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
