export interface ProductCardDTO {
  id: number;
  name: string;
  slug: string;
  categorySlugPath: string;
  imageKey: string;
  displayPrice: number;
}

export interface ProductListingDTO {
  items: ProductCardDTO[];
  nextCursor: string | null;
  hasMore: boolean;
}
