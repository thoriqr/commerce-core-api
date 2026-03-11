import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE carts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id bigint NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_carts_user_id
    ON carts(user_id);
  `);

  await knex.raw(`
    CREATE TRIGGER trg_carts_set_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS carts CASCADE
  `);
}
