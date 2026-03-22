import { Knex } from "knex";
import { InsertOrderPaymentInput } from "./order-payments.types";
import { MidtransWebhookPayload } from "./order-payments.schema";

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

  updatePaymentStatus = async (transactionId: string, payload: MidtransWebhookPayload, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE order_payments
    SET
      transaction_status = :transaction_status,
      fraud_status = :fraud_status,
      settlement_time = :settlement_time
    WHERE transaction_id = :transaction_id
  `,
      {
        transaction_id: transactionId,
        transaction_status: payload.transaction_status,
        fraud_status: payload.fraud_status ?? null,
        settlement_time: payload.settlement_time ? new Date(payload.settlement_time) : null
      }
    );
  };

  findByTransactionId = async (transactionId: string, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: { id: number; transaction_status: string }[];
    }>(
      `
    SELECT id, transaction_status
    FROM order_payments
    WHERE transaction_id = :transactionId
    LIMIT 1
    `,
      { transactionId }
    );

    return rows[0] ?? null;
  };
}
