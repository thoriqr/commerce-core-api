/// <reference types="jest" />

import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import { hashRefreshToken, generateRefreshToken } from "../../src/shared/jwt/refresh-token.util";

describe("POST /v1/auth/verify-email", () => {
  const createTokenData = () => {
    const rawToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawToken);
    return { rawToken, tokenHash };
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, pending_verifications, refresh_tokens CASCADE");
  });

  afterAll(async () => {
    await db.raw("TRUNCATE users, pending_verifications, refresh_tokens CASCADE");
    await db.destroy();
  });

  it("should verify email and create user", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `verify_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at)
     VALUES (:email, :tokenHash, :type, NOW() + interval '10 minutes')`,
      {
        email,
        tokenHash,
        type: "REGISTER"
      }
    );

    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test User"
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Email verified successfully");

    const cookies = res.headers["set-cookie"];

    expect(cookies).toBeDefined();
    expect(Array.isArray(cookies)).toBe(true);

    const cookieArr = cookies as unknown as string[];

    expect(cookieArr.some((c) => c.includes("access"))).toBe(true);
    expect(cookieArr.some((c) => c.includes("refresh"))).toBe(true);

    const user = await db.raw(`SELECT email FROM users WHERE email = :email`, { email });

    expect(user.rows.length).toBe(1);
  });

  it("should return 404 if token not found", async () => {
    const res = await request(app).post("/v1/auth/verify-email").send({
      token: "invalid_token",
      password: "password123",
      displayName: "Test"
    });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if token expired", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `expired_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at)
       VALUES (:email, :tokenHash, :type, NOW() - interval '1 minute')`,
      {
        email,
        tokenHash,
        type: "REGISTER"
      }
    );

    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test"
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if token already used", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `used_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at, used_at)
       VALUES (:email, :tokenHash, :type, NOW() + interval '10 minutes', NOW())`,
      {
        email,
        tokenHash,
        type: "REGISTER"
      }
    );

    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test"
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
