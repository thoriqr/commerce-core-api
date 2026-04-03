import { OrderPaymentStatus, OrderShipmentStatus, OrderStatus } from "@/shared/order/order.types";
import { OptionSnapshot } from "@/shared/variant-image/types";

export type OrderListingRow = {
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
  order_code: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;

  subtotal: number;
  shipping_cost: number;
  total: number;

  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string;
  postal_code: string | null;
  email: string;

  created_at: Date;
  paid_at: Date | null;
  cancelled_at: Date | null;

  // shipment
  courier_name: string;
  courier_service: string;
  tracking_number: string | null;
  shipment_status: OrderShipmentStatus;
  shipped_at: Date | null;
  delivered_at: Date | null;

  // payment (nullable)
  payment_status_midtrans: string | null;
  payment_type: string | null;
  bank: string | null;
  payment_code: string | null;
  transaction_time: Date | null;
  settlement_time: Date | null;
};

export type OrderItemRow = {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  slug: string;
  image_key: string | null;
  option_snapshot: OptionSnapshot | null;
};

export type OrderStateBase = {
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  shipment_status: OrderShipmentStatus;
};
