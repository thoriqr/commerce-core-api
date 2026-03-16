import { ProductStatus, ProductVariantStatus } from "@/shared/product/product.types";

export type CartItemRow = {
  variant_id: number;
  quantity: number;
  price: number;
  weight: number;
  product_name: string;
  stock: number;
};

export type SessionItemRow = {
  variant_id: number;
  product_name: string;
  price: number;
  quantity: number;
  weight: number;
  stock: number;
  variant_status: ProductVariantStatus;
  product_status: ProductStatus;
  slug: string;
};

export type SessionRow = {
  id: number;
  expires_at: Date;
  address_id: number | null;
  courier_code: string | null;
  courier_service: string | null;
  courier_description: string | null;
  courier_name: string | null;
  shipping_cost: number;
  shipping_etd: string | null;
};
