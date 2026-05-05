import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";

export async function createAdminAndLogin(): Promise<{
  cookies: string[];
  userId: number;
}> {
  const email = `admin_${Date.now()}@mail.com`;
  const password = "password123";

  const passwordHash = await bcrypt.hash(password, 10);

  const resInsert = await db.raw(
    `
    INSERT INTO users (email, password_hash, role, status)
    VALUES (:email, :passwordHash, 'ADMIN', 'ACTIVE')
    RETURNING id
    `,
    { email, passwordHash }
  );

  const userId = resInsert.rows[0].id;

  const res = await request(app).post("/v1/auth/login").send({ email, password });

  if (res.status !== 200) {
    throw new Error("Failed to login admin in test setup");
  }

  return {
    cookies: res.headers["set-cookie"] as unknown as string[],
    userId
  };
}

export async function createCategory(): Promise<number> {
  const slug = `test-category-${Date.now()}`;

  const res = await db.raw(
    `
    INSERT INTO categories (name, slug, status, id_path, slug_path)
    VALUES (:name, :slug, :status, :idPath, :slugPath)
    RETURNING id
    `,
    {
      name: "Test Category",
      slug,
      status: "ACTIVE",
      idPath: "1",
      slugPath: slug
    }
  );

  return res.rows[0].id;
}

export async function createCollection(): Promise<number> {
  const slug = `test-collection-${Date.now()}`;

  const res = await db.raw(
    `
    INSERT INTO collections (name, slug, status)
    VALUES (:name, :slug, :status)
    RETURNING id
    `,
    {
      name: "Test Collection",
      slug,
      status: "ACTIVE"
    }
  );

  return res.rows[0].id;
}
