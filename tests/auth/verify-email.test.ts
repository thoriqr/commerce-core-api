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

  it("should verify email, create user, and mark token as used", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `verify_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at)
       VALUES (:email, :tokenHash, :type, NOW() + interval '10 minutes')`,
      { email, tokenHash, type: "REGISTER" }
    );

    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test User"
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Email verified successfully");

    // cookies should be set
    const cookies = res.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    expect(cookies.some((c) => c.includes("access"))).toBe(true);
    expect(cookies.some((c) => c.includes("refresh"))).toBe(true);

    // user should be created
    const user = await db.raw(`SELECT email, password_hash, display_name FROM users WHERE email = :email`, { email });

    expect(user.rows.length).toBe(1);
    expect(user.rows[0].password_hash).toBeDefined();
    expect(user.rows[0].password_hash).not.toBe("password123");
    expect(user.rows[0].display_name).toBe("Test User");

    // token should be marked as used
    const pv = await db.raw(`SELECT used_at FROM pending_verifications WHERE token_hash = :tokenHash`, { tokenHash });

    expect(pv.rows[0].used_at).not.toBeNull();
  });

  it("should not allow token reuse after successful verification", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `reuse_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at)
       VALUES (:email, :tokenHash, :type, NOW() + interval '10 minutes')`,
      { email, tokenHash, type: "REGISTER" }
    );

    // first success
    await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test"
    });

    // reuse attempt
    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test"
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
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
      { email, tokenHash, type: "REGISTER" }
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
      { email, tokenHash, type: "REGISTER" }
    );

    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "Test"
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if password is too short", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `short_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at)
       VALUES (:email, :tokenHash, :type, NOW() + interval '10 minutes')`,
      { email, tokenHash, type: "REGISTER" }
    );

    const res = await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "123",
      displayName: "Test"
    });

    expect(res.status).toBe(400);
  });

  it("should trim displayName before saving", async () => {
    const { rawToken, tokenHash } = createTokenData();
    const email = `trim_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO pending_verifications (email, token_hash, type, expires_at)
       VALUES (:email, :tokenHash, :type, NOW() + interval '10 minutes')`,
      { email, tokenHash, type: "REGISTER" }
    );

    await request(app).post("/v1/auth/verify-email").send({
      token: rawToken,
      password: "password123",
      displayName: "   John Doe   "
    });

    const user = await db.raw(`SELECT display_name FROM users WHERE email = :email`, { email });

    expect(user.rows[0].display_name).toBe("John Doe");
  });
});
