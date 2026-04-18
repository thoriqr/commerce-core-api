import bcrypt from "bcrypt";
import { env } from "@/config/env";
import { db } from "@/infra/db/knex";

async function seedDemo() {
  const email = env.DEMO_EMAIL;
  const password = env.DEMO_PASSWORD;

  if (!email || !password) {
    throw new Error("DEMO_EMAIL and DEMO_PASSWORD must be set in env");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  // Check existing user
  const { rows } = await db.raw<{ rows: Array<{ id: number }> }>(
    `
    SELECT id FROM users
    WHERE email = :email
    `,
    { email: normalizedEmail }
  );

  if (rows.length > 0) {
    //  UPDATE (reset password + enforce demo state)
    await db.raw(
      `
      UPDATE users
      SET
        password_hash = :passwordHash,
        role = 'SUPER',
        status = 'ACTIVE',
        display_name = 'Demo Account',
        is_demo = true,
        updated_at = now()
      WHERE email = :email
      `,
      {
        email: normalizedEmail,
        passwordHash
      }
    );

    console.log("Demo user updated (password reset & enforced demo state)");
    return;
  }

  // CREATE
  await db.raw(
    `
    INSERT INTO users (
      email,
      password_hash,
      role,
      status,
      display_name,
      is_demo
    )
    VALUES (
      :email,
      :passwordHash,
      'SUPER',
      'ACTIVE',
      'Demo Account',
      true
    )
    `,
    {
      email: normalizedEmail,
      passwordHash
    }
  );

  console.log("Demo user created successfully");
}

seedDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
