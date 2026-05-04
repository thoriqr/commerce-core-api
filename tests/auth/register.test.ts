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

  it("should replace existing pending verification on re-register", async () => {
    const payload = createPayload();

    // first registration
    await request(app).post("/v1/auth/register").send(payload);

    const first = await db.raw(`SELECT id, token_hash FROM pending_verifications WHERE email = :email`, { email: payload.email });

    // second registration (should replace previous pending verification)
    await request(app).post("/v1/auth/register").send(payload);

    const second = await db.raw(`SELECT id, token_hash FROM pending_verifications WHERE email = :email`, { email: payload.email });

    // should only have one record
    expect(second.rows.length).toBe(1);

    // should be a new record (delete + insert, not update)
    expect(second.rows[0].id).not.toBe(first.rows[0].id);
    expect(second.rows[0].token_hash).not.toBe(first.rows[0].token_hash);
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app).post("/v1/auth/register").send({
      email: "invalid-email",
      password: "password123"
    });

    expect(res.status).toBe(400);
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
