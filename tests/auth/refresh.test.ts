/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import { generateRefreshToken, hashRefreshToken } from "../../src/shared/jwt/refresh-token.util";

describe("POST /v1/auth/refresh", () => {
  const createUserWithToken = async () => {
    const email = `refresh_${Date.now()}@mail.com`;
    const passwordHash = await bcrypt.hash("password123", 10);

    // insert user
    const userRes = await db.raw(
      `INSERT INTO users (email, password_hash, status)
       VALUES (:email, :passwordHash, 'ACTIVE')
       RETURNING id`,
      { email, passwordHash }
    );

    const userId = userRes.rows[0].id;

    // create refresh token
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

    return { userId, rawToken };
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, refresh_tokens RESTART IDENTITY CASCADE");
  });

  it("should refresh session, rotate token, and invalidate old token", async () => {
    const { rawToken } = await createUserWithToken();

    const res = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Session refreshed");

    const cookies = res.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    const accessCookie = cookies.find((c) => c.includes("access"));
    const refreshCookie = cookies.find((c) => c.includes("refresh"));

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    // ensure refresh token rotated (different from old)
    expect(refreshCookie).not.toContain(rawToken);

    // ensure old token revoked
    const tokens = await db.raw(`
    SELECT token_hash, revoked_at FROM refresh_tokens
  `);

    const revokedTokens = tokens.rows.filter((r: any) => r.revoked_at !== null);
    const activeTokens = tokens.rows.filter((r: any) => r.revoked_at === null);

    expect(revokedTokens.length).toBeGreaterThanOrEqual(1);
    expect(activeTokens.length).toBe(1); // only one active token
  });

  it("should allow using newly rotated refresh token", async () => {
    const { rawToken } = await createUserWithToken();

    const first = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    const cookies = first.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    const newRefresh = cookies
      .find((c) => c.includes("refresh_token"))!
      .split(";")[0]
      .split("=")[1];

    // use new token again
    const second = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${newRefresh}`]);

    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);
  });

  it("should reject reused old refresh token after rotation", async () => {
    const { rawToken } = await createUserWithToken();

    // first refresh
    const first = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(first.status).toBe(200);

    // try reuse old token
    const res = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if refresh token missing", async () => {
    const res = await request(app).post("/v1/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if token invalid", async () => {
    const res = await request(app).post("/v1/auth/refresh").set("Cookie", [`refresh_token=invalid_token`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if token expired", async () => {
    const email = `expired_${Date.now()}@mail.com`;
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
       VALUES (:userId, :tokenHash, NOW() - interval '1 minute')`,
      {
        userId,
        tokenHash
      }
    );

    const res = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject manually revoked refresh token", async () => {
    const { rawToken } = await createUserWithToken();
    const tokenHash = hashRefreshToken(rawToken);

    // revoke manually
    await db.raw(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = :tokenHash`,
      { tokenHash }
    );

    const res = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
