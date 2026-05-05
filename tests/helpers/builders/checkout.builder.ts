import { CheckoutItemSeed, CheckoutSessionSeed } from "../../types/checkout";

type BuildCheckoutInput = {
  userId: number;
  addressId: number | null;
  productId: number;
  variantId: number;

  price?: number;
  quantity?: number;
  weight?: number;
  shippingCost?: number;
};

export function buildCheckoutSeed(input: BuildCheckoutInput): {
  session: CheckoutSessionSeed;
  items: CheckoutItemSeed[];
} {
  const { userId, addressId, productId, variantId, price = 40000, quantity = 1, weight = 300, shippingCost = 10000 } = input;

  const id = Date.now();

  const subtotal = price * quantity;
  const total = subtotal + shippingCost;

  const session: CheckoutSessionSeed = {
    id,
    user_id: userId,
    address_id: addressId,

    courier_code: "jne",
    courier_service: "REG",
    courier_description: "Regular Service",
    courier_name: "JNE",

    shipping_cost: shippingCost,
    shipping_etd: "2-3 days",

    subtotal,
    total,

    expires_at: new Date(Date.now() + 60 * 60 * 1000),
    created_at: new Date(),
    updated_at: new Date(),

    converted_at: null,
    revoked_at: null,

    recipient_name: "Test User",
    phone: "081234567890",
    address_line: "Test Street No. 123",
    province_name: "Jawa Timur",
    city_name: "Surabaya",
    district_name: "Wonokromo",
    postal_code: "60243",

    shipping_city_id: 444,
    shipping_district_id: 1234
  };

  const items: CheckoutItemSeed[] = [
    {
      id: id + 1,
      checkout_session_id: id,
      variant_id: variantId,

      product_name: "Test Product",
      price,
      quantity,
      weight,

      product_id: productId,
      slug: "test-product",

      option_snapshot: [
        { value: "Black", dimension: "Color" },
        { value: "M", dimension: "Size" }
      ],

      created_at: new Date()
    }
  ];

  return { session, items };
}
