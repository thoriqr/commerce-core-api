import { CollectionDetailDTO, CollectionDTO } from "./collection.dto";
import { CollectionDetailRow, CollectionRow } from "./collection.types";

export function mapCollectionList(rows: (CollectionRow & { product_count: number })[]): CollectionDTO[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    isActive: r.is_active,
    sortOrder: r.sort_order,
    productCount: Number(r.product_count)
  }));
}

export function mapCollectionDetail(row: CollectionDetailRow): CollectionDetailDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    isActive: row.is_active,
    slug: row.slug,
    sortOrder: row.sort_order
  };
}
