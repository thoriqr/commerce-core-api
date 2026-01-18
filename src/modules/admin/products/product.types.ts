export type ProductStatus = "ACTIVE" | "INACTIVE";

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

// GET BY ID
export type ProductDetailRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_variant: boolean;
  status: ProductStatus;
};

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

export type IdMap = Map<string, number>;
