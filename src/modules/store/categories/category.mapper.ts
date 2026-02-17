import { CategoryDetailDTO, CategoryFilterDimensionDTO, CategoryNodeDTO, CategoryTopLevelDTO } from "./category.dto";
import { CategoryBreadcrumbRow, CategoryChildRow, CategoryDetailRow, CategoryFilterRow, CategoryRow, CategoryTopLevelRow } from "./category.types";

export function mapMegaMenu(rows: CategoryRow[]): CategoryNodeDTO[] {
  const map = new Map<number, CategoryNodeDTO>();
  const roots: CategoryNodeDTO[] = [];

  // 1️⃣ build map
  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      name: r.name,
      slug: r.slug,
      children: []
    });
  }

  // 2️⃣ link parent -> children
  for (const r of rows) {
    const node = map.get(r.id)!;

    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function mapTopLevelCategories(rows: CategoryTopLevelRow[]): CategoryTopLevelDTO[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug
  }));
}

function buildGenericDescription(name: string): string {
  return `Shop ${name} online. Discover top deals and new arrivals in ${name}.`;
}

export function mapCategoryDetail(
  current: CategoryDetailRow,
  breadcrumbRows: CategoryBreadcrumbRow[],
  childrenRows: CategoryChildRow[]
): CategoryDetailDTO {
  return {
    category: {
      id: current.id,
      name: current.name,
      description: current.description ?? buildGenericDescription(current.name),
      slug: current.slug,
      slugPath: current.slug_path
    },
    breadcrumb: breadcrumbRows.map((r) => ({
      id: r.id,
      name: r.name,
      slugPath: r.slug_path
    })),
    children: childrenRows.map((c) => ({
      id: c.id,
      name: c.name,
      slugPath: c.slug_path
    }))
  };
}

export function mapCategoryFilters(rows: CategoryFilterRow[]): CategoryFilterDimensionDTO[] {
  const map = new Map<string, CategoryFilterDimensionDTO>();

  for (const r of rows) {
    if (!map.has(r.dimension_name)) {
      map.set(r.dimension_name, {
        name: r.dimension_name,
        label: r.dimension_display_name,
        values: []
      });
    }

    map.get(r.dimension_name)!.values.push({
      value: r.value_normalized,
      label: r.value_display,
      count: Number(r.product_count),
      hexColor: r.hex_color
    });
  }

  return Array.from(map.values());
}
