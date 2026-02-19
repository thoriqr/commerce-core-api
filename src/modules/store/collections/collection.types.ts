export type CollectionPreviewRow = {
  collection_id: number;
  collection_name: string;
  collection_slug: string;

  product_id: number;
  product_name: string;
  product_slug: string;
  image_key: string;
  display_price: number;
  created_at: Date;
};

export type CollectionDetailRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  updated_at: Date | null;
};
