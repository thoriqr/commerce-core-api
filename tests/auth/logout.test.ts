/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import { generateRefreshToken, hashRefreshToken } from "../../src/shared/jwt/refresh-token.util";

describe("POST /v1/auth/logout", () => {
  const createUserWithRefreshToken = async () => {
    const email = `logout_${Date.now()}@mail.com`;
    const passwordHash = await bcrypt.hash("password123", 10);

    const userRes = await db.raw(
      `INSERT INTO users (email, password_hash, status)
       VALUES (:email, :passwordHash, 'ACTIVE')
       RETURNING id`,
      { email, passwordHash }
    );

    const userId = userRes.rows[0].id;

    const rawToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawToken);

    await db.raw(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (:userId, :tokenHash, NOW() + interval '7 days')`,
      {
        userId,
        tokenHash
      }
    );

    return { rawToken, tokenHash };
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, refresh_tokens CASCADE");
  });

  afterAll(async () => {
    await db.raw("TRUNCATE users, refresh_tokens CASCADE");
    await db.destroy();
  });

  it("should clear cookies and revoke refresh token", async () => {
    const { rawToken, tokenHash } = await createUserWithRefreshToken();

    const res = await request(app)
      .post("/v1/auth/logout")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged out successfully");

    const cookies = res.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    // ensure cookies are CLEARED (not just set)
    expect(cookies.some((c) => c.includes("access") && (c.includes("Max-Age=0") || c.includes("Expires=")))).toBe(true);

    expect(cookies.some((c) => c.includes("refresh") && (c.includes("Max-Age=0") || c.includes("Expires=")))).toBe(true);

    // token revoked
    const token = await db.raw(`SELECT revoked_at FROM refresh_tokens WHERE token_hash = :tokenHash`, { tokenHash });

    expect(token.rows[0].revoked_at).not.toBeNull();
  });

  it("should return 200 even if no refresh token (idempotent)", async () => {
    const res = await request(app).post("/v1/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should still return 200 with invalid token", async () => {
    const res = await request(app).post("/v1/auth/logout").set("Cookie", [`refresh_token=invalid_token`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should not fail if token already revoked", async () => {
    const { rawToken, tokenHash } = await createUserWithRefreshToken();

    await db.raw(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = :tokenHash`,
      { tokenHash }
    );

    const res = await request(app)
      .post("/v1/auth/logout")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const token = await db.raw(`SELECT revoked_at FROM refresh_tokens WHERE token_hash = :tokenHash`, { tokenHash });

    expect(token.rows[0].revoked_at).not.toBeNull();
  });
});
