import { prisma } from "../../shared/db/prisma.js";
import type {
  ListAttributesQuery,
  CreateAttributeBody,
  UpdateAttributeBody
} from "./attributes.validation.js";
import { AttributeType, type Prisma } from "@prisma/client";

const attributeSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  category: {
    select: {
      id: true,
      name: true
    }
  },
  options: {
    select: {
      id: true,
      value: true,
      sortOrder: true
    },
    orderBy: {
      sortOrder: "asc"
    }
  }
} satisfies Prisma.AttributeSelect;

export const attributesRepository = {
  findCategories() {
    return prisma.attributeCategory.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        name: "asc"
      }
    });
  },
  async findAttributes(filters: ListAttributesQuery) {
    const { prefix, categoryId, type, page, pageSize } = filters;
    const where: Prisma.AttributeWhereInput = {};
    if (prefix) {
      where.name = {
        startsWith: prefix,
        mode: "insensitive"
      };
    }
    if (type) {
      where.type = type;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const [items, total] = await prisma.$transaction([
      prisma.attribute.findMany({
        where,
        skip,
        take,
        orderBy: {
          name: "asc"
        },
        select: attributeSelect
      }),
      prisma.attribute.count({
        where
      })
    ]);
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  },
  async findAttributeById(id: string) {
    return prisma.attribute.findUnique({
      where: { id },
      select: attributeSelect
    });
  },
  async findCategoryById(categoryId: string) {
    return prisma.attributeCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true
      }
    });
  },
  async findAttributeByName(name: string) {
    return prisma.attribute.findUnique({
      where: { name },
      select: {
        id: true,
        name: true
      }
    });
  },
  async findAttributeNameConflict(name: string, excludeId: string) {
    return prisma.attribute.findFirst({
      where: { name, id: { not: excludeId } },
      select: {
        id: true,
        name: true
      }
    });
  },
  async createAttribute(data: CreateAttributeBody) {
    const { categoryId, name, description, type, options } = data;

    const mappedOptions = (options ?? []).map((option, index) => ({
      value: option,
      sortOrder: index
    }));
    return prisma.attribute.create({
      data: {
        categoryId,
        name,
        description,
        type,
        ...(type === AttributeType.DROPDOWN
          ? {
              options: {
                create: mappedOptions
              }
            }
          : {})
      },
      select: attributeSelect
    });
  },
  async updateAttributeWithVersion(id: string, data: UpdateAttributeBody) {
    const { version, categoryId, name, description, type, options } = data;
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.attribute.updateMany({
        where: { id, version },
        data: {
          categoryId,
          name,
          description,
          type,
          version: { increment: 1 }
        }
      });
      if (updateResult.count === 0) {
        return null;
      }
      await tx.attributeOption.deleteMany({
        where: { attributeId: id }
      });
      if (type === AttributeType.DROPDOWN) {
        const mappedOptions = (options ?? []).map((option, index) => ({
          attributeId: id,
          value: option,
          sortOrder: index
        }));
        await tx.attributeOption.createMany({
          data: mappedOptions
        });
      }
      return tx.attribute.findUnique({
        where: { id },
        select: attributeSelect
      });
    });
  },
  async deleteAttributeWithVersion(id: string, version: number) {
    const deleteResult = await prisma.attribute.deleteMany({
      where: { id, version }
    });
    return deleteResult.count;
  }
};
