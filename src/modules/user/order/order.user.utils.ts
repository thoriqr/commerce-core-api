import { AppError } from "@/errors/app-error";
import { CheckoutSessionItemRow, CheckoutSessionRow, ReadyCheckoutSession } from "../checkout/checkout.user.types";

export function assertCheckoutReady(session: CheckoutSessionRow): asserts session is ReadyCheckoutSession {
  // totals
  if (session.subtotal == null || session.shipping_cost == null || session.total == null) {
    throw AppError.badRequest("Checkout totals incomplete");
  }

  if (session.shipping_cost < 0) {
    throw AppError.badRequest("Invalid shipping cost");
  }

  // shipping data
  if (!session.shipping_etd) {
    throw AppError.badRequest("Shipping data incomplete");
  }

  if (!session.courier_code || !session.courier_service || !session.courier_name) {
    throw AppError.badRequest("Shipping method not set");
  }

  // address
  if (!session.recipient_name || !session.phone || !session.address_line || !session.province_name || !session.city_name || !session.district_name) {
    throw AppError.badRequest("Address invalid");
  }

  // integrity check
  const recalculatedTotal = session.subtotal + session.shipping_cost;

  if (recalculatedTotal !== session.total) {
    throw AppError.badRequest("Invalid total calculation");
  }
}

export function assertItemsValid(items: CheckoutSessionItemRow[]) {
  for (const item of items) {
    const productActive = item.product_status === "ACTIVE";
    const variantActive = item.variant_status === "ACTIVE";

    if (!productActive || !variantActive) {
      throw AppError.badRequest("Product unavailable");
    }

    if (item.price < 0) {
      throw AppError.badRequest("Invalid price");
    }

    if (item.quantity > item.stock) {
      throw AppError.badRequest("Insufficient stock");
    }

    if (item.weight < 0) {
      throw AppError.badRequest("Invalid item weight");
    }
  }
}

export function generateOrderCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `ORD-${date}-${random}`;
}
