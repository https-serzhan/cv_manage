import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuthenticatedUser, requireRole } from "../auth/auth.middleware.js";
import { adminController } from "./admin.controller.js";

export const adminRouter: ExpressRouter = Router();

adminRouter.use(requireAuthenticatedUser, requireRole("ADMIN"));

adminRouter.get("/users", adminController.getUsers);
adminRouter.get("/users/:id", adminController.getUserById);
adminRouter.put("/users/:id/roles", adminController.updateUserRoles);
