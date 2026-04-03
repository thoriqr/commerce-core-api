import { MidtransWebhookPayload } from "./payment.schema";
import { InsertOrderPaymentInput } from "./payment.types";

export function mapMidtransWebhookToPayment(payload: MidtransWebhookPayload, orderId: number): InsertOrderPaymentInput {
  let paymentCode: string | null = null;
  let bank: string | null = payload.bank ?? null;

  // cstore
  if (payload.payment_type === "cstore") {
    paymentCode = payload.payment_code ?? null;
  }

  // bank transfer
  if (payload.payment_type === "bank_transfer") {
    const va = payload.va_numbers?.[0];
    if (va) {
      paymentCode = va.va_number;
      bank = va.bank;
    }
  }

  return {
    order_id: orderId,
    order_code: payload.order_id,

    transaction_id: payload.transaction_id,
    payment_type: payload.payment_type,

    transaction_status: payload.transaction_status,
    fraud_status: payload.fraud_status ?? null,

    gross_amount: parseInt(payload.gross_amount, 10),
    currency: payload.currency ?? "IDR",

    payment_code: paymentCode,
    store: payload.store ?? null,
    bank,

    transaction_time: payload.transaction_time ? new Date(payload.transaction_time) : null,
    settlement_time: payload.settlement_time ? new Date(payload.settlement_time) : null,

    raw_payload: payload
  };
}
