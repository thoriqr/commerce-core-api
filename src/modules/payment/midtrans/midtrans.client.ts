import { env } from "@/config/env";

import { logger } from "@/libs/logger";
import { AppError } from "@/errors/app-error";
import { MidtransPayload, MidtransResponse } from "./midtrans.types";

export async function createSnapTransaction(payload: MidtransPayload): Promise<MidtransResponse> {
  const serverKey = env.MIDTRANS_SERVER_KEY!;
  const auth = Buffer.from(serverKey + ":").toString("base64");

  const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`Midtrans error: ${text}`);
    throw AppError.internal();
  }

  const data = (await res.json()) as MidtransResponse;

  return data;
}
