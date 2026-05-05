type BuildOrderInput = {
  userId: number;

  status?: "PENDING" | "PROCESSING" | "CANCELLED" | "COMPLETED";
  paymentStatus?: "UNPAID" | "PAID" | "FAILED" | "EXPIRED";

  subtotal?: number;
  shippingCost?: number;

  expiresAt?: Date;

  snapToken?: string | null;
  snapRedirectUrl?: string | null;
};

export function buildOrderSeed(input: BuildOrderInput) {
  const {
    userId,
    status = "PENDING",
    paymentStatus = "UNPAID",
    subtotal = 40000,
    shippingCost = 10000,
    expiresAt = new Date(Date.now() + 60 * 60 * 1000),
    snapToken = null,
    snapRedirectUrl = null
  } = input;

  const total = subtotal + shippingCost;

  return {
    id: Date.now(),
    user_id: userId,

    status,
    payment_status: paymentStatus,

    subtotal,
    shipping_cost: shippingCost,
    total,

    recipient_name: "Test User",
    phone: "081234567890",
    address_line: "Test Address",
    province_name: "Jawa Timur",
    city_name: "Surabaya",
    district_name: "Wonokromo",
    postal_code: "60243",

    email: "test@example.com",

    expires_at: expiresAt,
    order_code: `ORD-${Date.now()}`,

    snap_token: snapToken,
    snap_redirect_url: snapRedirectUrl,

    origin_name: "Test Warehouse",
    origin_province_name: "Jawa Timur",
    origin_city_name: "Surabaya",
    origin_district_name: "Wonokromo",
    origin_postal_code: "60243"
  };
}

type BuildOrderItemInput = {
  orderId: number;
  productId?: number;
  variantId?: number;

  price?: number;
  quantity?: number;
  weight?: number;
};

export function buildOrderItemSeed(input: BuildOrderItemInput) {
  const { orderId, productId = 1, variantId = 1, price = 40000, quantity = 1, weight = 300 } = input;

  return {
    id: Date.now(),
    order_id: orderId,
    product_id: productId,
    variant_id: variantId,

    product_name: "Test Product",
    slug: "test-product",

    price,
    quantity,
    weight,

    option_snapshot: null,
    image_key: null,
    image_id: null
  };
}

export function buildOrderShipmentSeed(orderId: number) {
  return {
    id: Date.now(),
    order_id: orderId,
    courier_code: "jne",
    courier_name: "JNE",
    courier_service: "REG",
    courier_description: "Regular",
    shipping_etd: "2-3 days",
    status: "PENDING"
  };
}
