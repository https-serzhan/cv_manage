import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { healthRouter } from "../modules/health/health.routes.js";
import { errorMiddleware } from "../shared/middleware/error-handler.js";
import { notFoundMiddleware } from "../shared/middleware/not-found.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.get("/", (_request, response) => {
    response.json({
      service: "cv-management-api",
      status: "ok"
    });
  });

  app.use("/health", healthRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
