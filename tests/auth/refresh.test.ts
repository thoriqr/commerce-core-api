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
    await db.raw("TRUNCATE users, refresh_tokens CASCADE");
  });

  afterAll(async () => {
    await db.raw("TRUNCATE users, refresh_tokens CASCADE");
    await db.destroy();
  });

  it("should refresh session and rotate token", async () => {
    const { rawToken } = await createUserWithToken();

    const res = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawToken}`]); // important

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Session refreshed");

    const cookies = res.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes("access"))).toBe(true);
    expect(cookies.some((c) => c.includes("refresh"))).toBe(true);

    // old token should be revoked
    const old = await db.raw(`SELECT revoked_at FROM refresh_tokens`);

    expect(old.rows.some((r: any) => r.revoked_at !== null)).toBe(true);
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

  it("should detect token reuse (revoked token)", async () => {
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
