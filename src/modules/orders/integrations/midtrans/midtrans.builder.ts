import { OrderForPaymentRow, OrderItemForPaymentRow } from "../../orders.types";
import { MidtransItem, MidtransPayload } from "./midtrans.types";

export function buildMidtransPayload(order: OrderForPaymentRow, items: OrderItemForPaymentRow[]): MidtransPayload {
  const itemDetails: MidtransItem[] = items.map((item) => ({
    id: String(item.product_id),
    price: item.price,
    quantity: item.quantity,
    name: item.product_name
  }));

  itemDetails.push({
    id: "SHIPPING",
    price: order.shipping_cost,
    quantity: 1,
    name: "Shipping Cost"
  });

  return {
    transaction_details: {
      order_id: order.order_code,
      gross_amount: order.total
    },
    item_details: itemDetails,
    customer_details: {
      first_name: order.recipient_name,
      phone: order.phone
    },
    notification_url: "https://webhook.commerce.web.id/api/payments/midtrans/webhook"
  };
}
