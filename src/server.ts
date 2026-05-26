import app from "./app";
import { env } from "./config/env";
import { logger } from "./libs/logger";
import { redis } from "./libs/redis";

// Global process error listeners

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

// Bootstrap application

async function bootstrap() {
  try {
    await redis.connect();
    logger.info("Redis connected");

    const server = app.listen(env.PORT, () => {
      logger.info(`Commerce Core API running on port ${env.PORT}`);
    });

    server.on("error", (err) => {
      logger.error("Server failed to start:", err);
      process.exit(1);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        if (redis.isOpen) {
          await redis.quit();
          logger.info("Redis connection closed");
        }

        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    logger.error("Failed to bootstrap server:", err);
    process.exit(1);
  }
}

bootstrap();
