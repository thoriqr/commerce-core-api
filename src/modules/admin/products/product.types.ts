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

export type VariantDetailRow = {
  id: number;
  product_id: number;
  price: number;
  stock: number;
  weight: number;
  sku: string | null;
  is_primary: boolean;
};

export type VariantOptionRow = {
  id: number;
  product_variant_id: number;
  name: string;
  value: string;
};
