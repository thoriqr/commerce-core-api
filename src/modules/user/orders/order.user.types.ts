import { CheckoutSessionItemRow, CheckoutSessionRow } from "@/modules/checkout/checkout.types";
import { OrderPaymentStatus, OrderShipmentStatus, OrderStatus } from "@/shared/order/order.types";
import { OptionSnapshot } from "@/shared/variant-image/types";

export type OrderByUser = {
  id: number;
  order_code: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  total: number;
  created_at: Date;
  shipment_status: OrderShipmentStatus;
  item_count: number;

  preview_name: string | null;
  preview_image: string | null;
};

export type OrderDetailRow = {
  id: number;
  user_id: number;
  order_code: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  payment_status: OrderPaymentStatus;
  status: OrderStatus;

  recipient_name: string;
  phone: string;
  province_name: string;
  city_name: string;
  district_name: string;
  postal_code: string | null;
  address_line: string;
  courier_code: string;
  courier_name: string;
  courier_service: string;
  courier_description: string | null;
  shipping_etd: string;
  tracking_number: string;
  shipment_status: OrderShipmentStatus;
  created_at: Date;
  updated_at: Date | null;
  expires_at: Date;
  paid_at: Date | null;
  cancelled_at: Date | null;
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
  districtName: string;
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
  payment_status: OrderPaymentStatus;
  expires_at: Date;
  status: OrderStatus;
  phone: string;
  snap_token: string | null;
  snap_redirect_url: string | null;
};

export type OrderItemForPaymentRow = {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  option_snapshot: OptionSnapshot[] | null;
};
