import crypto from "crypto";

export function generateETag(seed: string): string {
  const hash = crypto.createHash("sha1").update(seed).digest("hex");
  return `"${hash}"`;
}
