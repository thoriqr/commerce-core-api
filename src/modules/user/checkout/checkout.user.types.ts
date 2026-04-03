import { CheckoutSessionRow } from "@/modules/checkout/checkout.types";

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
  province_name: string;
  city_name: string;
  district_name: string;
};
