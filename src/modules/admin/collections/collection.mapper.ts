import { CollectionDetailDTO, CollectionDTO, CollectionOptionDTO } from "./collection.dto";
import { CollectionDetailRow, CollectionRow } from "./collection.types";

export function mapCollectionList(rows: (CollectionRow & { product_count: number })[]): CollectionDTO[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    status: r.status,
    sortOrder: r.sort_order,
    productCount: Number(r.product_count)
  }));
}

export function mapCollectionDetail(row: CollectionDetailRow): CollectionDetailDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    slug: row.slug,
    sortOrder: row.sort_order
  };
}

export function mapCollectionOptions(rows: { id: number; name: string }[]): CollectionOptionDTO[] {
  return rows.map((r) => ({
    value: String(r.id),
    label: r.name
  }));
}
