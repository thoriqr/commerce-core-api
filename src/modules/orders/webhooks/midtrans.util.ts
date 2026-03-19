import crypto from "crypto";

export function verifyMidtransSignature(payload: any, serverKey: string): boolean {
  const { order_id, status_code, gross_amount, signature_key } = payload;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return false;
  }

  const raw = order_id + status_code + gross_amount + serverKey;

  const expected = crypto.createHash("sha512").update(raw).digest("hex");

  return expected === signature_key;
}
