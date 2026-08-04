/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";

describe("POST /v1/auth/login", () => {
  const createUser = async (email: string, password: string, status = "ACTIVE"): Promise<number> => {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.raw(
      `INSERT INTO users (email, password_hash, status)
     VALUES (:email, :passwordHash, :status)
     RETURNING id`,
      {
        email,
        passwordHash,
        status
      }
    );

    return result.rows[0].id;
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, user_sessions, refresh_tokens RESTART IDENTITY CASCADE");
  });

  it("should login successfully, set cookies, and persist refresh token", async () => {
    const email = `login_${Date.now()}@mail.com`;
    const password = "password123";

    const userId = await createUser(email, password);

    const res = await request(app).post("/v1/auth/login").send({
      email,
      password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Login response should belong to the authenticated user.
    expect(res.body.data.userId).toBe(userId);

    const cookies = res.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    // cookies should exist
    expect(cookies.some((c) => c.includes("access"))).toBe(true);
    expect(cookies.some((c) => c.includes("refresh"))).toBe(true);

    // optional: ensure httpOnly flag exists
    expect(cookies.some((c) => c.toLowerCase().includes("httponly"))).toBe(true);

    // refresh token should be stored
    const tokens = await db.raw(`SELECT id FROM refresh_tokens`);
    expect(tokens.rows.length).toBe(1);

    const sessions = await db.raw(`SELECT id FROM user_sessions`);
    expect(sessions.rows.length).toBe(1);

    // last_login_at should be updated
    const user = await db.raw(`SELECT last_login_at FROM users WHERE email = :email`, { email });

    expect(user.rows[0].last_login_at).not.toBeNull();
  });

  it("should return user id and tokens in response body for mobile login", async () => {
    const email = `mobile_login_${Date.now()}@mail.com`;
    const password = "password123";

    const userId = await createUser(email, password);

    const res = await request(app).post("/v1/auth/login").set("x-auth-client", "mobile").send({
      email,
      password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.data.userId).toBe(userId);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("should return 401 if email not found", async () => {
    const res = await request(app).post("/v1/auth/login").send({
      email: "notfound@mail.com",
      password: "password123"
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if password is incorrect", async () => {
    const email = `wrong_${Date.now()}@mail.com`;

    await createUser(email, "password123");

    const res = await request(app).post("/v1/auth/login").send({
      email,
      password: "wrongpassword"
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app).post("/v1/auth/login").send({
      email: "invalid-email",
      password: "password123"
    });

    expect(res.status).toBe(400);
  });
});
