export type MidtransWebhookPayload = {
  transaction_id: string;
  order_id: string;
  payment_type: string;
  transaction_status: string;
  fraud_status?: string;

  gross_amount: string;
  currency: string;

  payment_code?: string;
  store?: string;

  va_numbers?: { bank: string; va_number: string }[];

  transaction_time?: string;
  settlement_time?: string;

  [key: string]: any;
};
