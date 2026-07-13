import type { NextFunction, Request, Response } from "express";

import { isAuthenticatedUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { cvsService } from "./cvs.service.js";
import type { CvPreviewViewer } from "./cvs.service.js";
import { cvPreviewParamsSchema } from "./cvs.validation.js";

function getCurrentViewer(request: Request): CvPreviewViewer {
  if (!isAuthenticatedUser(request.user)) {
    throw new AppError(401, "Authentication required");
  }

  return {
    userId: request.user.id,
    roleCodes: request.user.roles.map((role) => role.code)
  };
}

export const cvsController = {
  async getPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const params = cvPreviewParamsSchema.parse(req.params);
      const preview = await cvsService.getPreview(params.positionId, getCurrentViewer(req));
      return res.json(preview);
    } catch (error) {
      return next(error);
    }
  }
};
