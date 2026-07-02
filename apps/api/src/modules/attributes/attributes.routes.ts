import { Router } from "express";
import { attributesController } from "./attributes.controller.js";
import type { Router as ExpressRouter } from "express";
import { requireRole } from "../auth/auth.middleware.js";

export const attributesRouter: ExpressRouter = Router();
const requireAttributeManager = requireRole("RECRUITER", "ADMIN");

attributesRouter.get("/categories", attributesController.getCategories);
attributesRouter.get("/", attributesController.getAttributes);
attributesRouter.get("/:id", attributesController.getAttributeById);
attributesRouter.post("/", requireAttributeManager, attributesController.createAttribute);
attributesRouter.put("/:id", requireAttributeManager, attributesController.updateAttribute);
attributesRouter.delete("/:id", requireAttributeManager, attributesController.deleteAttribute);
