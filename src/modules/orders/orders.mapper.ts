import { CreateOrderBaseInput, OrderDetailRow, OrderItemDetailRow, ReadyCheckoutSession } from "./orders.types";

export function mapSessionToCreateOrderInput(session: ReadyCheckoutSession, userId: number): CreateOrderBaseInput {
  return {
    userId,
    subtotal: session.subtotal,
    shippingCost: session.shipping_cost,
    total: session.total,

    recipientName: session.recipient_name,
    phone: session.phone,
    addressLine: session.address_line,
    provinceName: session.province_name,
    cityName: session.city_name,
    districtName: session.district_name,
    postalCode: session.postal_code,

    note: null
  };
}

export function mapOrder(order: OrderDetailRow, items: OrderItemDetailRow[]) {
  const mappedItems = items.map((item) => ({
    productId: item.product_id,
    variantId: item.variant_id,
    name: item.product_name,
    slug: item.slug,
    price: item.price,
    quantity: item.quantity,
    weight: item.weight,

    imageKey: item.image_key
      ? {
          imageKey: item.image_key,
          imageId: item.image_id
        }
      : null,

    options: item.option_snapshot ?? []
  }));

  const isExpired = order.expires_at < new Date();
  const isFinalState =
    order.status === "CANCELLED" || order.status === "COMPLETED" || order.payment_status === "FAILED" || order.payment_status === "EXPIRED";

  const canPay = order.payment_status === "UNPAID" && !isFinalState && !isExpired;

  return {
    orderCode: order.order_code,

    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    total: order.total,
    status: order.status,
    paymentStatus: order.payment_status,

    expiresAt: order.expires_at,
    paidAt: order.paid_at,
    canPay,

    address: {
      recipientName: order.recipient_name,
      phone: order.phone,
      addressLine: order.address_line
    },

    shipping: {
      courierCode: order.courier_code,
      courierName: order.courier_name,
      courierService: order.courier_service,
      etd: order.shipping_etd
    },

    items: mappedItems
  };
}
