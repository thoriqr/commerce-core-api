import { AppError } from "@/errors/app-error";
import { CheckoutSessionRow } from "./checkout.types";

export function assertSessionActive(session: CheckoutSessionRow) {
  if (session.converted_at) {
    throw AppError.badRequest("Checkout already completed");
  }

  if (session.revoked_at) {
    throw AppError.badRequest("Checkout session revoked");
  }

  if (session.expires_at < new Date()) {
    throw AppError.badRequest("Checkout session expired");
  }
}
