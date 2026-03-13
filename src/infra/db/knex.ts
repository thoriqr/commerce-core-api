import { env } from "@/config/env";
import knex from "knex";
import pg from "pg";

pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => {
  return parseInt(value);
});

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
