import { CollectionDetailDTO, CollectionPreviewDTO } from "./collection.dto";
import { CollectionDetailRow, CollectionPreviewRow } from "./collection.types";

export function mapCollectionPreview(rows: CollectionPreviewRow[], productLimit: number): CollectionPreviewDTO[] {
  const map = new Map<number, CollectionPreviewDTO>();

  for (const r of rows) {
    if (!map.has(r.collection_id)) {
      map.set(r.collection_id, {
        id: r.collection_id,
        name: r.collection_name,
        slug: r.collection_slug,
        hasMoreProducts: false,
        products: []
      });
    }

    const collection = map.get(r.collection_id)!;

    collection.products.push({
      id: r.product_id,
      name: r.product_name,
      slug: r.product_slug,
      imageKey: r.image_key,
      displayPrice: r.display_price
    });
  }

  // inalize per collection
  for (const collection of map.values()) {
    if (collection.products.length > productLimit) {
      collection.hasMoreProducts = true;
      collection.products = collection.products.slice(0, productLimit);
    }
  }

  return Array.from(map.values());
}

export function mapCollectionDetail(row: CollectionDetailRow): CollectionDetailDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? `Explore our ${row.name} collection and discover curated products selected just for you.`
  };
}
