import { OptionSnapshot } from "@/shared/variant-image/types";
import { OrderForPaymentRow, OrderItemForPaymentRow } from "../../orders/order.types";
import { MidtransItem, MidtransPayload } from "../../orders/integrations/midtrans/midtrans.types";
import { env } from "@/config/env";

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
  const MAX_LENGTH = 50;

  const option = formatOptionSnapshot(item.option_snapshot);
  const optionLength = option.length;

  // reserve space for options first
  const remaining = MAX_LENGTH - optionLength;

  let base = item.product_name;

  if (remaining <= 0) {
    // option too long → fallback
    return option.slice(0, MAX_LENGTH - 3) + "...";
  }

  if (base.length > remaining) {
    base = base.slice(0, remaining - 3) + "...";
  }

  return base + option;
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

  const isDev = env.NODE_ENV !== "production";

  const duration = isDev ? 2 : remainingMinutes;

  return {
    transaction_details: {
      order_id: order.order_code,
      gross_amount: order.total
    },
    item_details: itemDetails,
    customer_details: {
      first_name: order.recipient_name,
      email: order.email,
      phone: order.phone,

      billing_address: {
        first_name: order.recipient_name,
        phone: order.phone,
        address: order.address_line,
        city: order.city_name,
        postal_code: order.postal_code ?? "-"
      },

      shipping_address: {
        first_name: order.recipient_name,
        phone: order.phone,
        address: order.address_line,
        city: order.city_name,
        postal_code: order.postal_code ?? "-"
      }
    },
    notification_url: "https://webhook.commerce.web.id/api/payments/midtrans/webhook",
    expiry: {
      start_time: formatDateToMidtrans(now),
      unit: "minute",
      duration
    }
  };
}
