import bcrypt from "bcrypt";
import { db } from "@/infra/db/knex";
import { env } from "@/config/env";

async function seedSuper() {
  const email = env.SUPER_EMAIL;
  const password = env.SUPER_PASSWORD;

  if (!email || !password) {
    throw new Error("SUPER_EMAIL and SUPER_PASSWORD must be set in env");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if already exists
  const { rows } = await db.raw<{ rows: Array<{ id: number }> }>(
    `
    SELECT id FROM users
    WHERE email = :email
    `,
    { email: normalizedEmail }
  );

  if (rows.length > 0) {
    console.log("SUPER user already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.raw(
    `
    INSERT INTO users (
      email,
      password_hash,
      role,
      status,
      display_name
    )
    VALUES (
      :email,
      :passwordHash,
      'SUPER',
      'ACTIVE',
      'Super Admin'
    )
    `,
    {
      email: normalizedEmail,
      passwordHash
    }
  );

  console.log("SUPER user created successfully");
}

seedSuper()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
