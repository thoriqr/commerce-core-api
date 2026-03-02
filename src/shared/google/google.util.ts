import { OAuth2Client } from "google-auth-library";
import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export type GoogleTokenPayload = {
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  sub: string; // google user id
};

/**
 * Verify Google ID Token
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw AppError.unauthorized("Invalid Google token");
    }

    if (!payload.email) {
      throw AppError.unauthorized("Google account has no email");
    }

    const result: GoogleTokenPayload = {
      email: payload.email,
      email_verified: payload.email_verified ?? false,
      sub: payload.sub
    };

    if (payload.name) {
      result.name = payload.name;
    }

    if (payload.picture) {
      result.picture = payload.picture;
    }

    return result;
  } catch {
    throw AppError.unauthorized("Google authentication failed");
  }
}
