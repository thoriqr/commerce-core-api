import { OptionSnapshot } from "@/shared/variant-image/types";
import { OrderForPaymentRow, OrderItemForPaymentRow } from "../../orders.types";
import { MidtransItem, MidtransPayload } from "./midtrans.types";

function formatDateToMidtrans(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} +0700`;
}

function formatOptionSnapshot(option: OptionSnapshot[] | null): string {
  if (!option || option.length === 0) return "";

  const formatted = option.map((opt) => `${opt.dimension}: ${opt.value}`).join(", ");

  return ` (${formatted})`;
}

function formatItemName(item: OrderItemForPaymentRow) {
  const base = item.product_name;
  const option = formatOptionSnapshot(item.option_snapshot);

  const full = base + option;

  return full.length > 50 ? full.slice(0, 47) + "..." : full;
}

export function buildMidtransPayload(order: OrderForPaymentRow, items: OrderItemForPaymentRow[]): MidtransPayload {
  const itemDetails: MidtransItem[] = items.map((item) => ({
    id: String(item.product_id),
    price: item.price,
    quantity: item.quantity,
    name: formatItemName(item)
  }));

  itemDetails.push({
    id: "SHIPPING",
    price: order.shipping_cost,
    quantity: 1,
    name: "Shipping Cost"
  });

  // REMAINING TIME
  const now = new Date();
  const remainingMs = order.expires_at.getTime() - now.getTime();

  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

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
    notification_url: "https://webhook.commerce.web.id/api/payments/midtrans/webhook",
    expiry: {
      start_time: formatDateToMidtrans(now),
      unit: "minute",
      duration: remainingMinutes
    }
  };
}
