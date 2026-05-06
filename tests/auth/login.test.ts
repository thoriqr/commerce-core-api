/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";

describe("POST /v1/auth/login", () => {
  const createUser = async (email: string, password: string, status = "ACTIVE") => {
    const passwordHash = await bcrypt.hash(password, 10);

    await db.raw(
      `INSERT INTO users (email, password_hash, status)
       VALUES (:email, :passwordHash, :status)`,
      {
        email,
        passwordHash,
        status
      }
    );
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, refresh_tokens RESTART IDENTITY CASCADE");
  });

  it("should login successfully, set cookies, and persist refresh token", async () => {
    const email = `login_${Date.now()}@mail.com`;
    const password = "password123";

    await createUser(email, password);

    const res = await request(app).post("/v1/auth/login").send({
      email,
      password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

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

    // last_login_at should be updated
    const user = await db.raw(`SELECT last_login_at FROM users WHERE email = :email`, { email });

    expect(user.rows[0].last_login_at).not.toBeNull();
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
