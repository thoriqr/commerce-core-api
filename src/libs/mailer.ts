import { env } from "@/config/env";
import { logger } from "./logger";

export async function mailer(params: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: "noreply@mail.commerce.web.id",
        name: "Commerce"
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html
    })
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`Brevo send failed: ${text}`);
    return false;
  }

  return true;
}
