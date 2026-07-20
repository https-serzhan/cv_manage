import type { NextFunction, Request, Response } from "express";

import { isAuthenticatedUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { adminService } from "./admin.service.js";
import {
  adminUserIdParamsSchema,
  listAdminUsersQuerySchema,
  updateAdminUserRolesBodySchema
} from "./admin.validation.js";

function getCurrentUserId(request: Request): string {
  if (!isAuthenticatedUser(request.user)) {
    throw new AppError(401, "Authentication required");
  }

  return request.user.id;
}

export const adminController = {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listAdminUsersQuerySchema.parse(req.query);
      const result = await adminService.getUsers(query);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  },
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = adminUserIdParamsSchema.parse(req.params);
      const user = await adminService.getUserById(params.id);
      return res.json(user);
    } catch (error) {
      return next(error);
    }
  },
  async updateUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const params = adminUserIdParamsSchema.parse(req.params);
      const body = updateAdminUserRolesBodySchema.parse(req.body);
      const user = await adminService.updateUserRoles(getCurrentUserId(req), params.id, body);
      return res.json(user);
    } catch (error) {
      return next(error);
    }
  }
};
