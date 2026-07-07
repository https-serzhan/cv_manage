import type { NextFunction, Request, Response } from "express";

import { isAuthenticatedUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { cvsService } from "./cvs.service.js";
import { cvPreviewParamsSchema } from "./cvs.validation.js";

function getCurrentUserId(request: Request): string {
  if (!isAuthenticatedUser(request.user)) {
    throw new AppError(401, "Authentication required");
  }

  return request.user.id;
}

export const cvsController = {
  async getPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const params = cvPreviewParamsSchema.parse(req.params);
      const preview = await cvsService.getPreview(params.positionId, getCurrentUserId(req));
      return res.json(preview);
    } catch (error) {
      return next(error);
    }
  }
};
