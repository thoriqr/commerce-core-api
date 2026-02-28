import crypto from "crypto";

/* =========================
   Generate Refresh Token
========================= */

export function generateRefreshToken(): string {
  // 64 bytes → 128 hex chars
  return crypto.randomBytes(64).toString("hex");
}

/* =========================
   Hash Refresh Token
========================= */

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/* =========================
   Timing-Safe Compare
========================= */

export function compareRefreshToken(plainToken: string, hashedToken: string): boolean {
  const hashedPlain = hashRefreshToken(plainToken);

  const bufferA = Buffer.from(hashedPlain, "hex");
  const bufferB = Buffer.from(hashedToken, "hex");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}
