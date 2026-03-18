import { CheckoutSessionRow, CreateOrderInput, ReadyCheckoutSession } from "./orders.types";

export function mapSessionToCreateOrderInput(session: ReadyCheckoutSession, userId: number): CreateOrderInput {
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
