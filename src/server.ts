import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./libs/logger";

app.listen(env.PORT, () => {
  logger.info(`Commerce Core API running on port ${env.PORT}`);
});
