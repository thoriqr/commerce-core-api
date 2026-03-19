export type InsertOrderPaymentInput = {
  order_id: number;
  order_code: string;

  transaction_id: string;
  payment_type: string;

  transaction_status: string;
  fraud_status: string | null;

  gross_amount: number;
  currency: string;

  payment_code: string | null;
  store: string | null;
  bank: string | null;

  transaction_time: Date | null;
  settlement_time: Date | null;

  raw_payload: any;
};
