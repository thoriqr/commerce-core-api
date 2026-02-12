export type ProductStatus = "ACTIVE" | "INACTIVE";

export type ProductVariantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_variant: boolean;
  status: ProductStatus;
  created_at: Date;
  updated_at: Date | null;
  category_id: number | null;
};

export type ProductCollectionIdRow = {
  collection_id: number;
};

// GET BY ID
export type ProductDetailRow = {
  id: number;
  name: string;
  description: string;
  is_variant: boolean;
  status: ProductStatus;
  category_id: number | null;
};

export type ImageRow = { id: number; image_key: string; sort_order: number };

export type VariantRow = {
  id: number;
  product_id: number;
  price: number;
  stock: number;
  weight: number;
  sku: string | null;
  is_primary: boolean;
};

export type VariantDimensionRow = {
  id: number;
  product_id: number;
  name: string;
  normalized_name: string;
  display_name: string;
};

export type VariantDimensionValueRow = {
  id: number;
  dimension_id: number;
  value: string;
  normalized_value: string;
  display_value: string;
};

export type VariantOptionValueRow = {
  id: number;
  variant_id: number;
  dimension_id: number;
  value_id: number;
};

// GET ALL
export type ProductListRow = {
  id: number;
  name: string;
  slug: string;
  thumbnail_image: string;
  is_variant: boolean;
  status: ProductStatus;
  category_name: string | null;
  total_stock: number;
  variant_count: number;
  min_price: number;
  max_price: number;
  representative_sku: string | null;
  created_at: Date;
};

export type VariantImageRow = {
  id: number;
  dimension_key: string;
  value_key: string;
  image_key: string;
};

export type IdMap = Map<string, number>;

export type VariantImageFilesMap = Map<
  string, // optionId
  {
    imageKey: string;
    originalFileName: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    originalAvailable: boolean;
  }
>;

export type ProductImageFilesMap = Map<
  number, // sortOrder
  {
    imageKey: string;
    originalFileName: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    originalAvailable: boolean;
  }
>;
