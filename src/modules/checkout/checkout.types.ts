import { ProductStatus, ProductVariantStatus } from "@/shared/product/product.types";
import { OptionSnapshot } from "@/shared/variant-image/types";

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
  product_id: number;
  price: number;
  quantity: number;
  weight: number;
  stock: number;
  variant_status: ProductVariantStatus;
  product_status: ProductStatus;
  slug: string;
  option_snapshot: OptionSnapshot[] | null;
};

export type SessionRow = {
  id: number;
  expires_at: Date;
  address_id: number | null;

  courier_code: string | null;
  courier_service: string | null;
  courier_description: string | null;
  courier_name: string | null;
  shipping_cost: number | null;
  shipping_etd: string | null;

  recipient_name: string | null;
  phone: string | null;
  address_line: string | null;
  province_name: string | null;
  city_name: string | null;
  district_name: string | null;
  postal_code: string | null;
};

export type CheckoutBlockReason = "INVALID_ITEMS" | "NO_ADDRESS" | "NO_SHIPPING" | "SHIPPING_NOT_CALCULATED" | null;
