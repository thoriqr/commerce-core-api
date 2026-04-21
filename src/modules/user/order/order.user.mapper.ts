import { OrderPaymentStatus, OrderShipmentStatus, OrderStatus } from "@/shared/order/order.types";
import { CreateOrderBaseInput, OrderByUser, OrderDetailRow, OrderItemDetailRow } from "./order.user.types";
import { ReadyCheckoutSession } from "../checkout/checkout.user.types";

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

export function mapOrdersByUser(row: OrderByUser) {
  return {
    id: row.id,
    orderCode: row.order_code,
    productId: row.product_id,
    slug: row.slug,

    status: mapOrderStatus(row, {
      status: row.shipment_status
    }),

    total: row.total,
    createdAt: row.created_at,

    itemCount: row.item_count ?? 0,

    previewItem: {
      name: row.preview_name ?? "",
      imageKey: row.preview_image
    },
    canConfirm: row.shipment_status === "SHIPPED"
  };
}

export function buildOrderTimeline(order: OrderDetailRow) {
  // 1. TERMINAL STATES
  if (order.status === "CANCELLED") {
    return [
      {
        key: "CANCELLED",
        label: "Order Cancelled",
        date: order.cancelled_at,
        isCompleted: true,
        isCurrent: true
      }
    ];
  }

  if (order.payment_status === "EXPIRED") {
    return [
      {
        key: "EXPIRED",
        label: "Payment Expired",
        date: order.expires_at,
        isCompleted: true,
        isCurrent: true
      }
    ];
  }

  if (order.payment_status === "FAILED") {
    return [
      {
        key: "FAILED",
        label: "Payment Failed",
        date: order.updated_at ?? null,
        isCompleted: true,
        isCurrent: true
      }
    ];
  }

  // 2. NORMAL FLOW

  const isPaid = order.payment_status === "PAID";
  const isShipped = order.shipment_status === "SHIPPED" || order.shipment_status === "DELIVERED";
  const isDelivered = order.shipment_status === "DELIVERED";

  return [
    {
      key: "WAITING_PAYMENT",
      label: "Waiting for Payment",
      date: order.created_at,
      isCompleted: true,
      isCurrent: !isPaid
    },
    {
      key: "PAID",
      label: "Payment Confirmed",
      date: order.paid_at,
      isCompleted: isPaid,
      isCurrent: isPaid && !isShipped
    },
    {
      key: "SHIPPED",
      label: "Order Shipped",
      date: order.shipped_at ?? null,
      isCompleted: isShipped,
      isCurrent: isShipped && !isDelivered
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      date: order.delivered_at ?? null,
      isCompleted: isDelivered,
      isCurrent: false
    }
  ];
}

export function mapOrderStatus(
  order: { status: OrderStatus; payment_status: OrderPaymentStatus },
  shipment?: { status: OrderShipmentStatus | null }
) {
  // 1. TERMINAL STATES (highest priority)
  if (order.status === "CANCELLED") return "CANCELLED";

  if (order.payment_status === "EXPIRED") return "EXPIRED";
  if (order.payment_status === "FAILED") return "FAILED";

  // 2. DELIVERY STATES (shipment-driven)
  if (shipment?.status === "DELIVERED") return "DELIVERED";
  if (shipment?.status === "SHIPPED") return "SHIPPED";

  // 3. ORDER STATES
  if (order.status === "COMPLETED") return "COMPLETED";
  if (order.status === "PROCESSING") return "PROCESSING";

  // 4. PAYMENT STATES
  if (order.status === "PENDING" && order.payment_status === "PAID") {
    return "PROCESSING";
  }

  if (order.status === "PENDING" && order.payment_status === "UNPAID") {
    return "WAITING_PAYMENT";
  }

  return "UNKNOWN";
}

export function canConfirmOrder(order: OrderDetailRow) {
  const isFinal =
    order.status === "CANCELLED" || order.status === "COMPLETED" || order.payment_status === "FAILED" || order.payment_status === "EXPIRED";

  return order.shipment_status === "SHIPPED" && !isFinal;
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

    imageKey: item.image_key,
    options: item.option_snapshot ?? []
  }));

  const isExpired = order.expires_at < new Date();

  const isFinalState =
    order.status === "CANCELLED" || order.status === "COMPLETED" || order.payment_status === "FAILED" || order.payment_status === "EXPIRED";

  const canPay = order.payment_status === "UNPAID" && !isFinalState && !isExpired;

  const hasOrigin = order.origin_name || order.origin_province_name || order.origin_city_name || order.origin_district_name;

  const warehouseOrigin = hasOrigin
    ? {
        name: order.origin_name,
        province: order.origin_province_name,
        city: order.origin_city_name,
        district: order.origin_district_name,
        postalCode: order.origin_postal_code ?? ""
      }
    : null;

  return {
    orderCode: order.order_code,

    // pricing
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    total: order.total,

    // derived status (NEW)
    status: mapOrderStatus(order, {
      status: order.shipment_status
    }),

    // optional raw (KEEP for flexibility)
    rawStatus: order.status,
    paymentStatus: order.payment_status,

    // timing
    expiresAt: order.expires_at,
    paidAt: order.paid_at,
    cancelledAt: order.cancelled_at ?? null,

    // action state
    canPay,
    canConfirm: canConfirmOrder(order),

    // address
    address: {
      recipientName: order.recipient_name,
      phone: order.phone,
      addressLine: order.address_line,
      provinceName: order.province_name,
      cityName: order.city_name,
      districtName: order.district_name,
      postalCode: order.postal_code ?? ""
    },

    // shipping
    shipping: {
      courierCode: order.courier_code,
      courierName: order.courier_name,
      courierService: order.courier_service,
      etd: order.shipping_etd,

      trackingNumber: order.tracking_number,
      status: order.shipment_status
    },

    warehouseOrigin,

    timeline: buildOrderTimeline(order),
    items: mappedItems
  };
}
