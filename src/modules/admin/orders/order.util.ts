import { AppError } from "@/errors/app-error";
import { OrderPaymentStatus, OrderStatus } from "@/shared/order/order.types";

export function assertUpdated(rowCount: number, message: string) {
  if (rowCount === 0) {
    throw AppError.badRequest(message);
  }
}

export function assertOrderActive(order: { status: OrderStatus; payment_status: OrderPaymentStatus }) {
  if (order.status === "CANCELLED") {
    throw AppError.badRequest("Order already cancelled");
  }

  if (order.payment_status === "FAILED" || order.payment_status === "EXPIRED") {
    throw AppError.badRequest("Invalid payment state");
  }
}
