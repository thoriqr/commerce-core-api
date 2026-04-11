import { OrderDetailRow, OrderItemRow, OrderListingRow, OrderStateBase } from "./order.types";

type AdminOrderStatus = "WAITING_PAYMENT" | "READY_TO_SHIP" | "SHIPPED" | "COMPLETED" | "CANCELLED" | "FAILED" | "EXPIRED";

export function mapAdminOrderStatus(row: OrderStateBase): AdminOrderStatus {
  const { status, payment_status, shipment_status } = row;

  const isPaid = payment_status === "PAID";

  /**
   * 1. TERMINAL STATES
   */
  if (status === "CANCELLED") return "CANCELLED";

  if (payment_status === "FAILED") return "FAILED";
  if (payment_status === "EXPIRED") return "EXPIRED";

  /**
   * 2. UNPAID
   */
  if (!isPaid) return "WAITING_PAYMENT";

  /**
   * 3. PAID FLOW
   */
  if (shipment_status === "PENDING") return "READY_TO_SHIP";

  if (shipment_status === "SHIPPED") return "SHIPPED";

  /**
   * DELIVERED → is COMPLETED
   */
  if (shipment_status === "DELIVERED") return "COMPLETED";

  /**
   * 4. FALLBACK
   */
  if (status === "COMPLETED") return "COMPLETED";

  return "READY_TO_SHIP";
}

function getOrderActions(row: OrderStateBase) {
  const isCancelled = row.status === "CANCELLED";

  const isPaymentInvalid = row.payment_status === "FAILED" || row.payment_status === "EXPIRED";

  const canShip = row.shipment_status === "PENDING" && row.payment_status === "PAID" && !isCancelled && !isPaymentInvalid;

  // const canDeliver = row.shipment_status === "SHIPPED" && !isCancelled && !isPaymentInvalid;

  return {
    canShip
    // canDeliver
  };
}

export function mapAdminOrder(row: OrderListingRow) {
  const status = mapAdminOrderStatus(row);
  const actions = getOrderActions(row);

  return {
    id: row.id,
    orderCode: row.order_code,

    status,

    rawStatus: row.status,
    paymentStatus: row.payment_status,
    shipmentStatus: row.shipment_status,

    total: row.total,
    createdAt: row.created_at,

    itemCount: row.item_count,

    previewItem: {
      name: row.preview_name,
      imageKey: row.preview_image
    },

    actions
  };
}

export function mapAdminOrderDetail(order: OrderDetailRow, items: OrderItemRow[]) {
  const status = mapAdminOrderStatus(order);
  const actions = getOrderActions(order);

  return {
    orderCode: order.order_code,

    status,

    email: order.email,

    pricing: {
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      total: order.total
    },

    address: {
      recipientName: order.recipient_name,
      phone: order.phone,
      addressLine: order.address_line,
      provinceName: order.province_name,
      cityName: order.city_name,
      districtName: order.district_name,
      postalCode: order.postal_code ?? ""
    },

    shipment: {
      courierName: order.courier_name,
      courierService: order.courier_service,
      trackingNumber: order.tracking_number,
      status: order.shipment_status,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at
    },

    // (payment section)
    payment: order.payment_status_midtrans
      ? {
          status: order.payment_status_midtrans,
          method: order.payment_type,
          bank: order.bank,
          code: order.payment_code,
          transactionTime: order.transaction_time,
          settlementTime: order.settlement_time
        }
      : null,

    timestamps: {
      createdAt: order.created_at,
      paidAt: order.paid_at,
      cancelledAt: order.cancelled_at
    },

    items: items.map((item) => ({
      name: item.product_name,
      slug: item.slug,
      price: item.price,
      quantity: item.quantity,
      imageKey: item.image_key,
      options: item.option_snapshot ?? []
    })),

    actions
  };
}
