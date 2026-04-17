import { CategoryDetailDTO, CategoryFilterDimensionDTO, CategoryNodeDTO, CategoryTopLevelDTO } from "./category.dto";
import { CategoryBreadcrumbRow, CategoryChildRow, CategoryDetailRow, CategoryFilterRow, CategoryPopularRow, CategoryRow } from "./category.types";

export function mapMegaMenu(rows: CategoryRow[]): CategoryNodeDTO[] {
  const map = new Map<number, CategoryNodeDTO>();
  const roots: CategoryNodeDTO[] = [];

  // build map
  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      parentId: r.parent_id,
      name: r.name,
      slug: r.slug,
      slugPath: r.slug_path,
      children: []
    });
  }

  // link parent -> children
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

export function mapPopularCategories(rows: CategoryPopularRow[]) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    slugPath: r.slug_path,
    totalSold: r.total_sold
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

const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl"];

function isSizeDimension(name: string) {
  return name.toLowerCase().includes("size");
}

function sortSizeValues(values: CategoryFilterDimensionDTO["values"]) {
  // Numeric size (38, 39, 40)
  const isNumeric = values.every((v) => /^\d+$/.test(v.value));

  if (isNumeric) {
    return values.sort((a, b) => Number(a.value) - Number(b.value));
  }

  // Alpha size (XS, S, M, etc)
  return values.sort((a, b) => {
    const aIndex = SIZE_ORDER.indexOf(a.value.toLowerCase());
    const bIndex = SIZE_ORDER.indexOf(b.value.toLowerCase());

    if (aIndex === -1 && bIndex === -1) {
      return a.label.localeCompare(b.label);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
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

  const result = Array.from(map.values());

  // SORT PER DIMENSION
  for (const dimension of result) {
    if (isSizeDimension(dimension.name)) {
      dimension.values = sortSizeValues(dimension.values);
    } else {
      dimension.values.sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  return result;
}
