import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuthenticatedUser, requireRole } from "../auth/auth.middleware.js";
import { profileController } from "./profile.controller.js";

export const profileRouter: ExpressRouter = Router();
const requireProfileManager = requireRole("CANDIDATE", "ADMIN");

profileRouter.use(requireAuthenticatedUser);

profileRouter.get("/project-tags", profileController.getProjectTags);
profileRouter.get("/me", requireProfileManager, profileController.getMyProfile);
profileRouter.put("/me", requireProfileManager, profileController.updateMyProfile);
profileRouter.get("/me/attributes", requireProfileManager, profileController.getMyAttributeValues);
profileRouter.put(
  "/me/attributes/:attributeId",
  requireProfileManager,
  profileController.updateMyAttributeValue
);
profileRouter.get("/me/projects", requireProfileManager, profileController.getMyProjects);
profileRouter.post("/me/projects", requireProfileManager, profileController.createMyProject);
profileRouter.put(
  "/me/projects/:projectId",
  requireProfileManager,
  profileController.updateMyProject
);
profileRouter.delete(
  "/me/projects/:projectId",
  requireProfileManager,
  profileController.deleteMyProject
);
