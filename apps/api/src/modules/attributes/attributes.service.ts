import { attributesRepository } from "./attributes.repository.js";
import type {
  ListAttributesQuery,
  CreateAttributeBody,
  UpdateAttributeBody
} from "./attributes.validation.js";
import { AppError } from "../../shared/errors/app-error.js";

export const attributesService = {
  getCategories() {
    return attributesRepository.findCategories();
  },
  getAttributes(filters: ListAttributesQuery) {
    return attributesRepository.findAttributes(filters);
  },
  async getAttributeById(id: string) {
    const attribute = await attributesRepository.findAttributeById(id);
    if (!attribute) {
      throw new AppError(404, "Attribute not found");
    }
    return attribute;
  },
  async createAttribute(data: CreateAttributeBody) {
    const category = await attributesRepository.findCategoryById(data.categoryId);
    if (!category) {
      throw new AppError(404, "Category not found");
    }
    const nameConflict = await attributesRepository.findAttributeByName(data.name);
    if (nameConflict) {
      throw new AppError(409, "Attribute name already exists");
    }
    return attributesRepository.createAttribute(data);
  },
  async updateAttribute(id: string, data: UpdateAttributeBody) {
    const attribute = await attributesRepository.findAttributeById(id);
    if (!attribute) {
      throw new AppError(404, "Attribute not found");
    }

    const category = await attributesRepository.findCategoryById(data.categoryId);
    if (!category) {
      throw new AppError(404, "Category not found");
    }

    const nameConflict = await attributesRepository.findAttributeNameConflict(data.name, id);
    if (nameConflict) {
      throw new AppError(409, "Attribute name already exists");
    }

    const updatedAttribute = await attributesRepository.updateAttributeWithVersion(id, data);
    if (!updatedAttribute) {
      throw new AppError(409, "Attribute was modified by another request");
    }
    return updatedAttribute;
  },
  async deleteAttribute(id: string, version: number) {
    const attribute = await attributesRepository.findAttributeById(id);
    if (!attribute) {
      throw new AppError(404, "Attribute not found");
    }
    const deletedCount = await attributesRepository.deleteAttributeWithVersion(id, version);
    if (deletedCount === 0) {
      throw new AppError(409, "Attribute version mismatch");
    }
  }
};
