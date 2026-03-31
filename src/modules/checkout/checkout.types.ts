import { ProductStatus, ProductVariantStatus } from "@/shared/product/product.types";
import { OptionSnapshot } from "@/shared/variant-image/types";

export type CartItemRow = {
  variant_id: number;
  product_id: number;
  slug: string;

  quantity: number;
  price: number;
  weight: number;
  product_name: string;
  option_snapshot: OptionSnapshot[] | null;
  stock: number;
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
};

export type CheckoutSessionRow = {
  id: number;
  user_id: number;
  address_id: number | null;
  courier_code: string | null;
  courier_service: string | null;
  courier_description: string | null;
  shipping_cost: number | null;
  shipping_etd: string | null;
  subtotal: number | null;
  total: number | null;
  courier_name: string | null;
  recipient_name: string | null;
  phone: string | null;
  address_line: string | null;
  province_name: string | null;
  city_name: string | null;
  district_name: string | null;
  postal_code: string | null;
  shipping_city_id: number | null;
  shipping_district_id: number | null;
  expires_at: Date;
  converted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
};

export type DefaultAddressRow = {
  id: number;
  user_id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string;
  postal_code: string | null;
  shipping_city_id: number;
  shipping_district_id: number | null;
};

export type UpsertAddress = {};

export type CheckoutBlockReason = "INVALID_ITEMS" | "NO_ADDRESS" | "NO_SHIPPING" | "SHIPPING_NOT_CALCULATED" | null;

export type AddressSnapshotInput = {
  id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string;
  postal_code: string | null;
  shipping_city_id: number;
  shipping_district_id: number | null;
};

export type CheckoutAddressSnapshot = {
  address_id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string;
  postal_code: string | null;
  shipping_city_id: number;
  shipping_district_id: number | null;
};
