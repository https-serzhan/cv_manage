import type { ErrorRequestHandler } from "express";

import { AppError } from "../errors/app-error.js";
import { logger } from "../logger/index.js";
import { ZodError } from "zod";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message
    });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation failed",
      issues: error.issues
    });
    return;
  }

  logger.error(error);

  response.status(500).json({
    message: "Internal server error"
  });
};
