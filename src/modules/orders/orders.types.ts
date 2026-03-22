import { OptionSnapshot } from "@/shared/variant-image/types";
import { ProductStatus, ProductVariantStatus } from "../admin/products/product.types";

export type UpdateResult = {
  rowCount: number;
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
  expires_at: Date;
  converted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
  courier_name: string | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string | null;
  postal_code: string | null;
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

export type CreateOrderBaseInput = {
  userId: number;
  subtotal: number;
  shippingCost: number;
  total: number;

  recipientName: string;
  phone: string;
  addressLine: string;
  provinceName: string;
  cityName: string;
  districtName: string | null;
  postalCode: string | null;

  note: null;
};

export type CreateOrderInput = CreateOrderBaseInput & {
  expiresAt: Date;
  orderCode: string;
  email: string;
};

export type ShipmentInput = {
  orderId: number;
  courierCode: string;
  courierName: string;
  courierService: string;
  courierDescription: string | null;
  shippingEtd: string;
};

export type InsertOrderItemInput = CheckoutSessionItemRow & {
  image_id: number | null;
  image_key: string | null;
};

export type ReadyCheckoutSession = CheckoutSessionRow & {
  // totals
  subtotal: number;
  shipping_cost: number;
  total: number;

  // shipping
  shipping_etd: string;
  courier_code: string;
  courier_name: string;
  courier_service: string;

  // address
  recipient_name: string;
  phone: string;
  address_line: string;
};

export type OrderItemForPaymentRow = {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  option_snapshot: OptionSnapshot[] | null;
};

export type OrderForPaymentRow = {
  id: number;
  email: string;
  recipient_name: string;
  city_name: string;
  address_line: string;
  postal_code: string | null;
  order_code: string;
  total: number;
  shipping_cost: number;
  payment_status: string;
  expires_at: Date;
  status: string;
  phone: string;
};

export type OrderDetailRow = {
  id: number;
  order_code: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  payment_status: string;
  status: string;
  expires_at: Date;
  paid_at: Date | null;
  cancelled_at: Date | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  courier_code: string;
  courier_name: string;
  courier_service: string;
  courier_description: string | null;
  shipping_etd: string;
  tracking_number: string;
  shipment_status: string;
  shipped_at: Date | null;
  delivered_at: Date | null;
};

export type OrderItemDetailRow = {
  product_id: number;
  variant_id: number;
  product_name: string;
  slug: string;
  price: number;
  quantity: number;
  weight: number;
  image_key: string | null;
  image_id: number | null;
  option_snapshot: OptionSnapshot[] | null;
};
