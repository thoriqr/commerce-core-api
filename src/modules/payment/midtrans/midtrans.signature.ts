import crypto from "crypto";
import { MidtransWebhookPayload } from "../payment.schema";

export function verifyMidtransSignature(payload: MidtransWebhookPayload, serverKey: string): boolean {
  const orderId = String(payload.order_id);
  const statusCode = String(payload.status_code);
  const grossAmount = String(payload.gross_amount);
  const signatureKey = String(payload.signature_key);

  const raw = orderId + statusCode + grossAmount + serverKey;

  const expected = crypto.createHash("sha512").update(raw, "utf8").digest("hex");

  return expected === signatureKey;
}
