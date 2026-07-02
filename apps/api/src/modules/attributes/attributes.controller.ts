import type { Request, Response, NextFunction } from "express";
import { attributesService } from "./attributes.service.js";
import {
  listAttributesQuerySchema,
  attributeIdParamsSchema,
  createAttributeBodySchema,
  updateAttributeBodySchema,
  deleteAttributeQuerySchema
} from "./attributes.validation.js";

export const attributesController = {
  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await attributesService.getCategories();
      return res.json(categories);
    } catch (error) {
      return next(error);
    }
  },
  async getAttributes(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listAttributesQuerySchema.parse(req.query);
      const attributes = await attributesService.getAttributes(filters);
      return res.json(attributes);
    } catch (error) {
      return next(error);
    }
  },
  async getAttributeById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = attributeIdParamsSchema.parse(req.params);
      const attribute = await attributesService.getAttributeById(params.id);
      return res.json(attribute);
    } catch (error) {
      return next(error);
    }
  },
  async createAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createAttributeBodySchema.parse(req.body);
      const attribute = await attributesService.createAttribute(body);
      return res.status(201).json(attribute);
    } catch (error) {
      return next(error);
    }
  },
  async updateAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const params = attributeIdParamsSchema.parse(req.params);
      const body = updateAttributeBodySchema.parse(req.body);
      const updated = await attributesService.updateAttribute(params.id, body);
      return res.json(updated);
    } catch (error) {
      return next(error);
    }
  },
  async deleteAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const params = attributeIdParamsSchema.parse(req.params);
      const query = deleteAttributeQuerySchema.parse(req.query);
      await attributesService.deleteAttribute(params.id, query.version);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
};
