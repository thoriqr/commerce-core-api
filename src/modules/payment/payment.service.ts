import { TransactionManager } from "@/infra/db/transaction-manager";
import { OrderRepo } from "../order/order.repo";
import { PaymentRepo } from "./payment.repo";
import { AppError } from "@/errors/app-error";
import { MidtransWebhookPayload } from "./payment.schema";
import { mapMidtransWebhookToPayment } from "./payment.mapper";
import { PAYMENT_STATUS_RANK } from "./payment.constants";
import { ProductMetricsRepo } from "../product/product-metrics.repo";

export class PaymentService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly orderRepo: OrderRepo,
    private readonly paymentRepo: PaymentRepo,
    private readonly productMetricsRepo: ProductMetricsRepo
  ) {}

  handleMidtransWebhook = async (payload: MidtransWebhookPayload) => {
    return this.tm.transaction(async (trx) => {
      // 1. FIND ORDER
      const order = await this.orderRepo.getOrderByCodeForUpdate(payload.order_id, trx);

      if (!order) {
        throw AppError.notFound("Order not found");
      }

      // 2. CHECK EXISTING PAYMENT
      const existing = await this.paymentRepo.findByTransactionId(payload.transaction_id, trx);

      const isFirstTime = !existing;
      const isProgression = existing && existing.transaction_status !== payload.transaction_status;

      console.log("webhook payload:", payload);

      // 3. INSERT / UPDATE PAYMENT
      if (isFirstTime) {
        const paymentInput = mapMidtransWebhookToPayment(payload, order.id);
        await this.paymentRepo.insertPayment(paymentInput, trx);
      } else if (isProgression) {
        const currentRank = PAYMENT_STATUS_RANK[existing.transaction_status] ?? 0;
        const incomingRank = PAYMENT_STATUS_RANK[payload.transaction_status] ?? 0;

        if (incomingRank < currentRank) {
          console.log("Ignore downgrade status", {
            current: existing.transaction_status,
            incoming: payload.transaction_status
          });
        } else {
          await this.paymentRepo.updatePaymentStatus(payload.transaction_id, payload, trx);
        }
      }
      // duplicate → no-op

      const status = payload.transaction_status;

      const isPaidEvent = status === "settlement" || (status === "capture" && payload.fraud_status === "accept");

      // 4. HANDLE PAYMENT FIRST (HIGHEST PRIORITY)
      if (isPaidEvent) {
        if (order.payment_status !== "PAID") {
          await this.orderRepo.markOrderPaid(order.id, trx);

          // increment variant sold in here
          await this.productMetricsRepo.incrementVariantSold(order.id, trx);
        }
        return;
      }

      // 5. GUARD FINAL STATES
      if (order.payment_status === "PAID") {
        return;
      }

      if (order.status === "CANCELLED" || order.status === "COMPLETED") {
        console.log("Ignore webhook for final order state", {
          orderId: order.id,
          status: order.status,
          incoming: payload.transaction_status
        });
        return;
      }

      // 6. OTHER STATES

      if (status === "expire") {
        await this.orderRepo.markOrderExpired(order.id, trx);
        return;
      }

      if (status === "cancel" || status === "deny" || status === "failure") {
        await this.orderRepo.markOrderFailed(order.id, trx);
        return;
      }

      // pending / authorize → no action
    });
  };
}
