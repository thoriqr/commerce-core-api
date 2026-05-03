/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";

describe("POST /v1/auth/login", () => {
  const createUser = async (email: string, password: string) => {
    const passwordHash = await bcrypt.hash(password, 10);

    await db.raw(
      `INSERT INTO users (email, password_hash, status)
       VALUES (:email, :passwordHash, 'ACTIVE')`,
      {
        email,
        passwordHash
      }
    );
  };

  beforeEach(async () => {
    await db.raw("TRUNCATE users, refresh_tokens CASCADE");
  });

  afterAll(async () => {
    await db.raw("TRUNCATE users, refresh_tokens CASCADE");
    await db.destroy();
  });

  it("should login successfully and set cookies", async () => {
    const email = `login_${Date.now()}@mail.com`;
    const password = "password123";

    await createUser(email, password);

    const res = await request(app).post("/v1/auth/login").send({
      email,
      password
    });

    expect(res.status).toBe(500); // force fail
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logged in successfully");

    const cookies = res.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes("access"))).toBe(true);
    expect(cookies.some((c) => c.includes("refresh"))).toBe(true);

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
});
