import { ProductCardDTO, ProductListingDTO } from "./product.dto";
import { ProductCardRow } from "./product.types";

export function mapProductListing(rows: ProductCardRow[], nextCursor: string | null, hasMore: boolean): ProductListingDTO {
  return {
    items: rows.map((r) => mapProductCard(r)),
    nextCursor,
    hasMore
  };
}

function mapProductCard(row: ProductCardRow): ProductCardDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categorySlugPath: row.category_slug_path,
    imageKey: row.image_key,
    displayPrice: Number(row.display_price)
  };
}
