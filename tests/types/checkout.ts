// tests/types/checkout.ts

export type CheckoutSessionSeed = {
  id: number;
  user_id: number;
  address_id: number | null;

  courier_code: string;
  courier_service: string;
  courier_description: string;
  courier_name: string;

  shipping_cost: number;
  shipping_etd: string;

  subtotal: number;
  total: number;

  expires_at: Date;
  created_at: Date;
  updated_at: Date;

  converted_at: Date | null;
  revoked_at: Date | null;

  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string;
  postal_code: string;

  shipping_city_id: number;
  shipping_district_id: number;
};

export type CheckoutItemSeed = {
  id: number;
  checkout_session_id: number;
  variant_id: number;

  product_name: string;
  price: number;
  quantity: number;
  weight: number;

  product_id: number;
  slug: string;

  option_snapshot: unknown;

  created_at: Date;
};
