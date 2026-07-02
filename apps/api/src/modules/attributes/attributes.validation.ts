import { z } from "zod";
import { AttributeType } from "@prisma/client";

type DataValidateAttributeType = {
  type: AttributeType;
  options?: string[];
};

function validateAttributeOptions(data: DataValidateAttributeType, ctx: z.RefinementCtx) {
  if (data.type === AttributeType.DROPDOWN && (!data.options || data.options.length === 0)) {
    ctx.addIssue({
      code: "custom",
      message: "DROPDOWN options are missing",
      path: ["options"]
    });
  }
  if (data.type !== AttributeType.DROPDOWN && data.options && data.options.length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Options are meant to use with DROPDOWN type",
      path: ["options"]
    });
  }
  if (data.options) {
    const optionsSet: Set<string> = new Set();
    for (const option of data.options) {
      optionsSet.add(option.toLowerCase());
    }
    if (optionsSet.size !== data.options.length) {
      ctx.addIssue({
        code: "custom",
        message: "Options should be unique",
        path: ["options"]
      });
    }
  }
}

export const listAttributesQuerySchema = z.object({
  prefix: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  type: z.nativeEnum(AttributeType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListAttributesQuery = z.infer<typeof listAttributesQuerySchema>;

export const attributeIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export type AttributeIdParams = z.infer<typeof attributeIdParamsSchema>;

export const createAttributeBodySchema = z
  .object({
    categoryId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().nullable().optional(),
    type: z.nativeEnum(AttributeType),
    options: z.array(z.string().trim().min(1)).optional()
  })
  .superRefine(validateAttributeOptions);

export type CreateAttributeBody = z.infer<typeof createAttributeBodySchema>;

export const updateAttributeBodySchema = z
  .object({
    categoryId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().nullable().optional(),
    type: z.nativeEnum(AttributeType),
    options: z.array(z.string().trim().min(1)).optional(),
    version: z.coerce.number().int().min(1)
  })
  .superRefine(validateAttributeOptions);

export type UpdateAttributeBody = z.infer<typeof updateAttributeBodySchema>;

export const deleteAttributeQuerySchema = z.object({
  version: z.coerce.number().int().min(1)
});

export type DeleteAttributeQuery = z.infer<typeof deleteAttributeQuerySchema>;
