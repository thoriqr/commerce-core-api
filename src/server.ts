import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./libs/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`Commerce Core API running on port ${env.PORT}`);
});

server.on("error", (err) => {
  console.error("Server failed to start:", err);
});
