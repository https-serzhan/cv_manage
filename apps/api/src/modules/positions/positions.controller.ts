import type { NextFunction, Request, Response } from "express";

import { isAuthenticatedUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { positionsService } from "./positions.service.js";
import type { PositionViewer } from "./positions.service.js";
import {
  createPositionBodySchema,
  deletePositionQuerySchema,
  duplicatePositionBodySchema,
  listPositionsQuerySchema,
  positionIdParamsSchema,
  updatePositionAccessBodySchema,
  updatePositionBodySchema
} from "./positions.validation.js";

function getCurrentUserId(request: Request): string {
  if (!isAuthenticatedUser(request.user)) {
    throw new AppError(401, "Authentication required");
  }

  return request.user.id;
}

function getPositionViewer(request: Request): PositionViewer {
  if (!request.isAuthenticated() || !isAuthenticatedUser(request.user) || request.user.isBlocked) {
    return null;
  }

  return {
    userId: request.user.id,
    roleCodes: request.user.roles.map((role) => role.code)
  };
}

export const positionsController = {
  async getPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listPositionsQuerySchema.parse(req.query);
      const result = await positionsService.getPositions(query, getPositionViewer(req));
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  },
  async getPositionById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = positionIdParamsSchema.parse(req.params);
      const position = await positionsService.getPositionById(params.id, getPositionViewer(req));
      return res.json(position);
    } catch (error) {
      return next(error);
    }
  },
  async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createPositionBodySchema.parse(req.body);
      const position = await positionsService.createPosition(getCurrentUserId(req), body);
      return res.status(201).json(position);
    } catch (error) {
      return next(error);
    }
  },
  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const params = positionIdParamsSchema.parse(req.params);
      const body = updatePositionBodySchema.parse(req.body);
      const position = await positionsService.updatePosition(params.id, body);
      return res.json(position);
    } catch (error) {
      return next(error);
    }
  },
  async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const params = positionIdParamsSchema.parse(req.params);
      const query = deletePositionQuerySchema.parse(req.query);
      await positionsService.deletePosition(params.id, query.version);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
  async duplicatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const params = positionIdParamsSchema.parse(req.params);
      const body = duplicatePositionBodySchema.parse(req.body ?? {});
      const position = await positionsService.duplicatePosition(
        params.id,
        getCurrentUserId(req),
        body
      );
      return res.status(201).json(position);
    } catch (error) {
      return next(error);
    }
  },
  async getPositionAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const params = positionIdParamsSchema.parse(req.params);
      const access = await positionsService.getPositionAccess(params.id);
      return res.json(access);
    } catch (error) {
      return next(error);
    }
  },
  async updatePositionAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const params = positionIdParamsSchema.parse(req.params);
      const body = updatePositionAccessBodySchema.parse(req.body);
      const access = await positionsService.updatePositionAccess(params.id, body);
      return res.json(access);
    } catch (error) {
      return next(error);
    }
  }
};
