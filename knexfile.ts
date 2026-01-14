import "dotenv/config";
import type { Knex } from "knex";
import { env } from "./src/config/env";

const config: Knex.Config = {
  client: "pg",
  connection: env.DATABASE_URL,
  migrations: {
    directory: "./migrations"
  }
};

export default config;
