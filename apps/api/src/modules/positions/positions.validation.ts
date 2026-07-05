import { PositionAccessMode } from "@prisma/client";
import { z } from "zod";

function validateUniqueAttributeIds(
  data: { attributes: Array<{ attributeId: string }> },
  ctx: z.RefinementCtx
) {
  const seen = new Set<string>();

  data.attributes.forEach((attribute, index) => {
    if (seen.has(attribute.attributeId)) {
      ctx.addIssue({
        code: "custom",
        message: "Attributes should be unique",
        path: ["attributes", index, "attributeId"]
      });
    }

    seen.add(attribute.attributeId);
  });
}

function validateUniqueCandidateIds(
  data: { accessMode?: PositionAccessMode; allowedCandidateUserIds?: string[] },
  ctx: z.RefinementCtx
) {
  if (data.accessMode === PositionAccessMode.PUBLIC) {
    return;
  }

  const seen = new Set<string>();

  data.allowedCandidateUserIds?.forEach((candidateId, index) => {
    if (seen.has(candidateId)) {
      ctx.addIssue({
        code: "custom",
        message: "Allowed candidates should be unique",
        path: ["allowedCandidateUserIds", index]
      });
    }

    seen.add(candidateId);
  });
}

const positionAttributeInputSchema = z.object({
  attributeId: z.string().trim().min(1),
  isRequired: z.boolean().optional()
});

const positionBodyBaseSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  accessMode: z.nativeEnum(PositionAccessMode),
  maxProjects: z.coerce.number().int().positive().nullable().optional(),
  attributes: z.array(positionAttributeInputSchema),
  projectTagNames: z.array(z.string()).optional(),
  allowedCandidateUserIds: z.array(z.string().trim().min(1)).optional()
});

export const listPositionsQuerySchema = z.object({
  prefix: z.string().trim().min(1).optional(),
  accessMode: z.nativeEnum(PositionAccessMode).optional(),
  attributeId: z.string().trim().min(1).optional(),
  projectTagId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListPositionsQuery = z.infer<typeof listPositionsQuerySchema>;

export const positionIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export type PositionIdParams = z.infer<typeof positionIdParamsSchema>;

export const createPositionBodySchema = positionBodyBaseSchema.superRefine((data, ctx) => {
  validateUniqueAttributeIds(data, ctx);
  validateUniqueCandidateIds(data, ctx);
});

export type CreatePositionBody = z.infer<typeof createPositionBodySchema>;

export const updatePositionBodySchema = positionBodyBaseSchema
  .extend({
    version: z.coerce.number().int().min(1)
  })
  .superRefine((data, ctx) => {
    validateUniqueAttributeIds(data, ctx);
    validateUniqueCandidateIds(data, ctx);
  });

export type UpdatePositionBody = z.infer<typeof updatePositionBodySchema>;

export const deletePositionQuerySchema = z.object({
  version: z.coerce.number().int().min(1)
});

export type DeletePositionQuery = z.infer<typeof deletePositionQuerySchema>;

export const duplicatePositionBodySchema = z.object({
  title: z.string().trim().min(1).optional()
});

export type DuplicatePositionBody = z.infer<typeof duplicatePositionBodySchema>;

export const updatePositionAccessBodySchema = z
  .object({
    accessMode: z.nativeEnum(PositionAccessMode),
    allowedCandidateUserIds: z.array(z.string().trim().min(1)),
    version: z.coerce.number().int().min(1)
  })
  .superRefine(validateUniqueCandidateIds);

export type UpdatePositionAccessBody = z.infer<typeof updatePositionAccessBodySchema>;
