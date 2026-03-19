import { Knex } from "knex";
import { InsertOrderPaymentInput } from "./order-payments.types";

export class OrderPaymentsRepo {
  insertPayment = async (input: InsertOrderPaymentInput, trx: Knex.Transaction) => {
    await trx.raw(
      `
    INSERT INTO order_payments (
      order_id,
      order_code,
      transaction_id,
      payment_type,
      transaction_status,
      fraud_status,
      gross_amount,
      currency,
      payment_code,
      store,
      bank,
      transaction_time,
      settlement_time,
      raw_payload
    )
    VALUES (
      :orderId,
      :orderCode,
      :transactionId,
      :paymentType,
      :transactionStatus,
      :fraudStatus,
      :grossAmount,
      :currency,
      :paymentCode,
      :store,
      :bank,
      :transactionTime,
      :settlementTime,
      :rawPayload
    )
    ON CONFLICT (transaction_id) DO NOTHING
    `,
      {
        orderId: input.order_id,
        orderCode: input.order_code,
        transactionId: input.transaction_id,
        paymentType: input.payment_type,
        transactionStatus: input.transaction_status,
        fraudStatus: input.fraud_status,
        grossAmount: input.gross_amount,
        currency: input.currency,
        paymentCode: input.payment_code,
        store: input.store,
        bank: input.bank,
        transactionTime: input.transaction_time,
        settlementTime: input.settlement_time,
        rawPayload: JSON.stringify(input.raw_payload)
      }
    );
  };
}
