import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuthenticatedUser, requireRole } from "../auth/auth.middleware.js";
import { cvsController } from "./cvs.controller.js";

export const cvsRouter: ExpressRouter = Router();
const requireCvPreviewUser = [requireAuthenticatedUser, requireRole("CANDIDATE", "ADMIN")];

cvsRouter.get("/preview/:positionId", requireCvPreviewUser, cvsController.getPreview);
