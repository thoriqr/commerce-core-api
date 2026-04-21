import { env } from "@/config/env";
import knex from "knex";
import pg from "pg";

pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => {
  return parseInt(value);
});

const isProd = env.NODE_ENV === "production";

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
    max: 5
  },
  migrations: {
    tableName: "knex_migrations"
  }
});
