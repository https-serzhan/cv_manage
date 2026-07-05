import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuthenticatedUser, requireRole } from "../auth/auth.middleware.js";
import { positionsController } from "./positions.controller.js";

export const positionsRouter: ExpressRouter = Router();
const requirePositionManager = [requireAuthenticatedUser, requireRole("RECRUITER", "ADMIN")];

positionsRouter.get("/", positionsController.getPositions);
positionsRouter.post("/", requirePositionManager, positionsController.createPosition);
positionsRouter.get("/:id/access", requirePositionManager, positionsController.getPositionAccess);
positionsRouter.put("/:id/access", requirePositionManager, positionsController.updatePositionAccess);
positionsRouter.post("/:id/duplicate", requirePositionManager, positionsController.duplicatePosition);
positionsRouter.get("/:id", positionsController.getPositionById);
positionsRouter.put("/:id", requirePositionManager, positionsController.updatePosition);
positionsRouter.delete("/:id", requirePositionManager, positionsController.deletePosition);
