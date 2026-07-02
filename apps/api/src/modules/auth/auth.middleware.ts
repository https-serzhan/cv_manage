import type { RequestHandler } from "express";
import { isAuthenticatedUser } from "./auth.types.js";
import { getAuthenticatedUserById } from "./auth.service.js";

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

export function requireRole(...allowedRoleCodes: string[]): RequestHandler {
  return async (request, response, next) => {
    try {
      const currentUser = isAuthenticatedUser(request.user) ? request.user : null;

      if (!request.isAuthenticated() || !currentUser) {
        response.status(401).json({
          message: "Authentication required"
        });
        return;
      }

      const freshUser = await getAuthenticatedUserById(currentUser.id);

      if (!freshUser) {
        response.status(401).json({
          message: "Authentication required"
        });
        return;
      }

      if (freshUser.isBlocked) {
        response.status(403).json({
          message: "User account is blocked"
        });
        return;
      }

      const hasAllowedRole = freshUser.roles.some((role) => allowedRoleCodes.includes(role.code));

      if (!hasAllowedRole) {
        response.status(403).json({
          message: "Insufficient permissions"
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
