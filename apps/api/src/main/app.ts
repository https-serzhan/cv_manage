import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";

import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { attributesRouter } from "../modules/attributes/attributes.routes.js";
import { configurePassport } from "../modules/auth/passport.js";
import { cvsRouter } from "../modules/cvs/cvs.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { positionsRouter } from "../modules/positions/positions.routes.js";
import { env } from "./env.js";
import { logger } from "../shared/logger/index.js";
import { errorMiddleware } from "../shared/middleware/error-handler.js";
import { notFoundMiddleware } from "../shared/middleware/not-found.js";

const sessionCookieName = "cv.sid";
const sessionMaxAgeMs = 1000 * 60 * 60 * 24 * 7;

export function createApp(): Express {
  const app = express();

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
    logger.warn(
      "express-session MemoryStore is development-only. Configure a durable session store before production deployment."
    );
  }

  configurePassport();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_BASE_URL, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    session({
      name: sessionCookieName,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: sessionMaxAgeMs,
        sameSite: "lax",
        secure: env.NODE_ENV === "production"
      }
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(morgan("dev"));

  app.get("/", (_request, response) => {
    response.json({
      service: "cv-management-api",
      status: "ok"
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/api/attributes", attributesRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/positions", positionsRouter);
  app.use("/api/cvs", cvsRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
