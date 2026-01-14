import knex from "knex";
import { env } from "../../config/env";

export const db = knex({
  client: "pg",
  connection: env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations"
  }
});
