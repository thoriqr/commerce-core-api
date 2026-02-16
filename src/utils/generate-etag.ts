import crypto from "crypto";

export function generateETag(seed: string): string {
  return crypto.createHash("sha1").update(seed).digest("hex");
}
