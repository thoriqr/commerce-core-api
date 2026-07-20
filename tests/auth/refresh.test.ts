/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import { generateRefreshToken, hashRefreshToken } from "../../src/shared/jwt/refresh-token.util";
import { ERROR_CODE } from "../../src/constants/error-code";

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

    const sessionRes = await db.raw(
      `INSERT INTO user_sessions (user_id, client, last_used_at)
       VALUES (:userId, 'web', NOW())
       RETURNING id`,
      { userId }
    );

    const sessionId = sessionRes.rows[0].id;

    // create refresh token
    const rawToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawToken);

    await db.raw(
      `INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at)
       VALUES (:userId, :sessionId, :tokenHash, NOW() + interval '7 days')`,
      {
        userId,
        sessionId,
        tokenHash
      }
    );

    return { userId, sessionId, rawToken };
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, user_sessions, refresh_tokens RESTART IDENTITY CASCADE");
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

  it("should return rotated tokens in response body for mobile refresh", async () => {
    const { rawToken } = await createUserWithToken();

    const res = await request(app).post("/v1/auth/refresh").set("x-auth-client", "mobile").send({
      refreshToken: rawToken
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(rawToken);
    expect(res.headers["set-cookie"]).toBeUndefined();
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

  it("should revoke only the compromised session when refresh token reuse is detected", async () => {
    const firstSession = await createUserWithToken();

    const secondRawToken = generateRefreshToken();
    const secondTokenHash = hashRefreshToken(secondRawToken);

    const sessionRes = await db.raw(
      `INSERT INTO user_sessions (user_id, client, last_used_at)
       VALUES (:userId, 'mobile', NOW())
       RETURNING id`,
      { userId: firstSession.userId }
    );

    const secondSessionId = sessionRes.rows[0].id;

    await db.raw(
      `INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at)
       VALUES (:userId, :sessionId, :tokenHash, NOW() + interval '7 days')`,
      {
        userId: firstSession.userId,
        sessionId: secondSessionId,
        tokenHash: secondTokenHash
      }
    );

    const first = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${firstSession.rawToken}`]);

    expect(first.status).toBe(200);

    const reused = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${firstSession.rawToken}`]);

    expect(reused.status).toBe(401);

    const sessions = await db.raw(
      `
      SELECT id, revoked_at
      FROM user_sessions
      WHERE id = :firstSessionId
        OR id = :secondSessionId
      `,
      {
        firstSessionId: firstSession.sessionId,
        secondSessionId
      }
    );

    const compromised = sessions.rows.find((s: any) => s.id === firstSession.sessionId);
    const other = sessions.rows.find((s: any) => s.id === secondSessionId);

    expect(compromised.revoked_at).not.toBeNull();
    expect(other.revoked_at).toBeNull();
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

    const sessionRes = await db.raw(
      `INSERT INTO user_sessions (user_id, client, last_used_at)
       VALUES (:userId, 'web', NOW())
       RETURNING id`,
      { userId }
    );

    const sessionId = sessionRes.rows[0].id;

    const rawToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawToken);

    await db.raw(
      `INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at)
       VALUES (:userId, :sessionId, :tokenHash, NOW() - interval '1 minute')`,
      {
        userId,
        sessionId,
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
