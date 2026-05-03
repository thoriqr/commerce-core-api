import { env } from "@/config/env";
import knex from "knex";
import pg from "pg";

pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => {
  return parseInt(value);
});

const isProd = env.NODE_ENV === "production";
const isTest = env.NODE_ENV === "test";

export const db = knex({
  client: "pg",
  connection: {
    connectionString: env.DATABASE_URL,
    ...(isProd && {
      ssl: {
        rejectUnauthorized: false
      }
    })
  },
  pool: {
    min: 0,
    max: isTest ? 1 : 5,
    idleTimeoutMillis: isTest ? 1000 : 30000
  },
  migrations: {
    tableName: "knex_migrations"
  }
});
