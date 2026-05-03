/// <reference types="jest" />

import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";

describe("POST /v1/auth/register", () => {
  const createPayload = () => ({
    email: `test_${Date.now()}@mail.com`,
    password: "password123"
  });

  beforeEach(async () => {
    await db.raw("TRUNCATE users, pending_verifications CASCADE");
  });

  afterAll(async () => {
    await db.raw("TRUNCATE users, pending_verifications CASCADE");
    await db.destroy();
  });

  it("should send verification email", async () => {
    const payload = createPayload();

    const res = await request(app).post("/v1/auth/register").send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Verification email sent");
  });

  it("should allow multiple registration attempts", async () => {
    const payload = createPayload();

    const res1 = await request(app).post("/v1/auth/register").send(payload);

    const res2 = await request(app).post("/v1/auth/register").send(payload);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
  });

  it("should return 409 if email already registered", async () => {
    const email = `test_${Date.now()}@mail.com`;

    await db.raw(
      `INSERT INTO users (email, password_hash)
     VALUES (:email, :password)`,
      {
        email,
        password: "dummy"
      }
    );

    const res = await request(app).post("/v1/auth/register").send({
      email,
      password: "password123"
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
