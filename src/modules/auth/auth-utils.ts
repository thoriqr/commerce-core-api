import { AppError } from "@/errors/app-error";
import { PendingVerificationRow } from "./auth.types";

export function validatePending(pending: PendingVerificationRow | null) {
  if (!pending) {
    throw AppError.notFound("Invalid token");
  }

  if (pending.used_at) {
    throw AppError.badRequest("Token already used");
  }

  if (new Date(pending.expires_at) < new Date()) {
    throw AppError.badRequest("Token expired");
  }

  return pending;
}
