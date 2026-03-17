import { OptionSnapshot } from "@/shared/variant-image/types";
import { ProductStatus, ProductVariantStatus } from "../admin/products/product.types";

export type CheckoutSessionRow = {
  id: number;
  user_id: number;
  address_id: number;
  courier_code: string | null;
  courier_service: string | null;
  courier_description: string | null;
  shipping_cost: number | null;
  shipping_etd: string | null;
  subtotal: number | null;
  total_weight: number | null;
  total: number | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date | null;
  courier_name: number | null;
};

export type CheckoutSessionItemRow = {
  variant_id: number;
  product_name: string;
  product_id: number;
  price: number;
  quantity: number;
  weight: number;
  stock: number;
  variant_status: ProductVariantStatus;
  product_status: ProductStatus;
  slug: string;
  option_snapshot: OptionSnapshot[] | null;
  image_key: string | null;
};
