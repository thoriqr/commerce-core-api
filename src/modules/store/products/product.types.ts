export type ProductCardRow = {
  id: number;
  name: string;
  slug: string;
  image_key: string;
  display_price: number;
  created_at: Date;
};

export type ProductBasicRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  is_variant: boolean;
  category_name: string;
  category_slug_path: string;
  updated_at: Date;
};

export type VariantRow = {
  variant_id: number;
  dimension_key: string | null;
  value_key: string | null;
  is_primary: boolean;
  updated_at: Date;
};

export type DimensionRow = {
  dimension_key: string;
  dimension_label: string;
  value_key: string;
  value_label: string;
  hex_color: string | null;
};

export type ImageRow = {
  image_id: number;
  image_key: string;
  dimension_key: string | null;
  value_key: string | null;
  image_type: "product" | "variant";
};

export type VariantDetailRow = {
  variant_id: number;
  price: number;
  stock: number;
  sku: string | null;
  currency: string;
  weight: number;
  weight_unit: string;
  variant_status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  product_status: "ACTIVE" | "INACTIVE";
  updated_at: Date;
};

export type ProductFilterRow = {
  dimension_name: string;
  dimension_display_name: string;
  value_normalized: string;
  value_display: string;
  product_count: number;
  hex_color: string | null;
};
