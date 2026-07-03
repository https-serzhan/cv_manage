import type { NextFunction, Request, Response } from "express";

import { isAuthenticatedUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { profileService } from "./profile.service.js";
import {
  attributeIdParamsSchema,
  createProjectBodySchema,
  deleteProjectQuerySchema,
  listProjectTagsQuerySchema,
  projectIdParamsSchema,
  updateAttributeValueBodySchema,
  updateProfileBodySchema,
  updateProjectBodySchema
} from "./profile.validation.js";

function getCurrentUserId(request: Request): string {
  if (!isAuthenticatedUser(request.user)) {
    throw new AppError(401, "Authentication required");
  }

  return request.user.id;
}

export const profileController = {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getMyProfile(getCurrentUserId(req));
      return res.json(profile);
    } catch (error) {
      return next(error);
    }
  },
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const body = updateProfileBodySchema.parse(req.body);
      const profile = await profileService.updateMyProfile(getCurrentUserId(req), body);
      return res.json(profile);
    } catch (error) {
      return next(error);
    }
  },
  async getMyAttributeValues(req: Request, res: Response, next: NextFunction) {
    try {
      const values = await profileService.getMyAttributeValues(getCurrentUserId(req));
      return res.json(values);
    } catch (error) {
      return next(error);
    }
  },
  async updateMyAttributeValue(req: Request, res: Response, next: NextFunction) {
    try {
      const params = attributeIdParamsSchema.parse(req.params);
      const body = updateAttributeValueBodySchema.parse(req.body);
      const value = await profileService.saveMyAttributeValue(
        getCurrentUserId(req),
        params.attributeId,
        body
      );
      return res.json(value);
    } catch (error) {
      return next(error);
    }
  },
  async getMyProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await profileService.getMyProjects(getCurrentUserId(req));
      return res.json(projects);
    } catch (error) {
      return next(error);
    }
  },
  async createMyProject(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createProjectBodySchema.parse(req.body);
      const project = await profileService.createMyProject(getCurrentUserId(req), body);
      return res.status(201).json(project);
    } catch (error) {
      return next(error);
    }
  },
  async updateMyProject(req: Request, res: Response, next: NextFunction) {
    try {
      const params = projectIdParamsSchema.parse(req.params);
      const body = updateProjectBodySchema.parse(req.body);
      const project = await profileService.updateMyProject(
        getCurrentUserId(req),
        params.projectId,
        body
      );
      return res.json(project);
    } catch (error) {
      return next(error);
    }
  },
  async deleteMyProject(req: Request, res: Response, next: NextFunction) {
    try {
      const params = projectIdParamsSchema.parse(req.params);
      const query = deleteProjectQuerySchema.parse(req.query);
      await profileService.deleteMyProject(getCurrentUserId(req), params.projectId, query.version);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
  async getProjectTags(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listProjectTagsQuerySchema.parse(req.query);
      const result = await profileService.getProjectTags(query);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
};
