import { env } from "@/config/env";
import winston from "winston";

const { combine, timestamp, colorize, printf } = winston.format;

const detailedFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : "";
  return `${timestamp} [${level}]: ${message} ${metaString}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), colorize({ all: true }), detailedFormat),
  transports: [
    new winston.transports.Console({
      handleExceptions: true
      // add more options here
    })
  ]
});
