import "dotenv/config";
import express from "express";
import compression from "compression";

import apiV1 from "./routes/v1/versioning.js";

import { prisma } from "./lib/prisma.js";
import { globalErrorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiting.js";
import { setupSwagger } from "./config/swagger.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import { logger } from "./utils/logger.js";
import { error } from "node:console";

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

/* ================= HEALTH CHECK ================= */
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date(),
      service: "prisma-node-api",
      environment: process.env.NODE_ENV,
      database: "connected"
    });
  } catch {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/* ================= ROOT ================= */
app.get("/", (_req, res) => {
  res.send("Airbnb API is running...");
});

/* ================= DOCS ================= */
setupSwagger(app);

/* ================= ROUTES ================= */
app.use("/api/v1", apiLimiter, apiV1);

/* ================= ERROR HANDLING ================= */
app.use(notFoundHandler);
app.use(globalErrorHandler);

/* ================= START SERVER ================= */
async function main() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

main();