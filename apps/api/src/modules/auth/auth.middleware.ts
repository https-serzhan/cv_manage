import type { RequestHandler } from "express";

import { isAuthenticatedUser } from "./auth.types.js";

export const requireAuthenticatedUser: RequestHandler = (request, response, next) => {
  const currentUser = isAuthenticatedUser(request.user) ? request.user : null;

  if (!request.isAuthenticated() || !currentUser) {
    response.status(401).json({
      message: "Authentication required"
    });
    return;
  }

  if (currentUser.isBlocked) {
    response.status(403).json({
      message: "User account is blocked"
    });
    return;
  }

  next();
};
