import { BreadcrumbRow } from "@/modules/store/categories/category.types";
import { CategoryDetailDTO, CategoryFlatDTO, CategoryParentDTO, CategoryParentTreeDTO } from "./category.dto";
import { CategoryDetailRow, CategoryFlatRow, CategoryParentRow, CategoryRow } from "./category.types";
import { BreadcrumbDTO } from "@/modules/store/categories/category.dto";

export function mapCategoryParents(rows: CategoryParentRow[]): CategoryParentDTO[] {
  return rows.map((r) => ({
    id: r.id,
    parentId: r.parent_id,
    name: r.name,
    slug: r.slug,
    sortOrder: r.sort_order,
    status: r.status
  }));
}

export function mapCategoryParentTree(rows: CategoryRow[]): CategoryParentTreeDTO | undefined {
  const map = new Map<number, CategoryParentTreeDTO>();
  const roots: CategoryParentTreeDTO[] = [];

  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      parentId: r.parent_id,
      name: r.name,
      slug: r.slug,
      status: r.status,
      sortOrder: r.sort_order,
      children: []
    });
  }

  // 2) link parent -> children
  for (const r of rows) {
    const node = map.get(r.id)!;

    if (r.parent_id !== null && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children.push(node);
    } else {
      // root (self / parent main)
      roots.push(node);
    }
  }

  return roots[0];
}

export function mapCategoryDetail(row: CategoryDetailRow): CategoryDetailDTO {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    status: row.status
  };
}

export function mapCategoryFlat(rows: CategoryFlatRow[]): CategoryFlatDTO[] {
  return rows.map((r) => ({
    value: String(r.id),
    label: r.path
  }));
}

export function mapBreadcrumb(rows: BreadcrumbRow[]): BreadcrumbDTO[] {
  return rows.map((r) => ({
    name: r.name,
    slug: r.slug,
    fullSlug: r.slug_path
  }));
}
