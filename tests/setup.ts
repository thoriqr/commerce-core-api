import { db } from "../src/infra/db/knex";

afterAll(async () => {
  await db.destroy();
});
