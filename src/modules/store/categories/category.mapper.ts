import { CategoryMetadataDTO, CategoryNodeDTO, CategoryTopLevelDTO } from "./category.dto";
import { CategoryMetadataRow, CategoryRow, CategoryTopLevelRow } from "./category.types";

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

const STORE_NAME = "Commerce"; // can be in env

export function mapCategoryMetadata(row: CategoryMetadataRow): CategoryMetadataDTO {
  const title = `${row.name} | ${STORE_NAME}`;

  const description = row.description ?? `Browse ${row.name} collection at ${STORE_NAME}. Discover curated products and latest arrivals.`;

  return {
    title,
    description
  };
}
