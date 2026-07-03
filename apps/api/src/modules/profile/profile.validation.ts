import { z } from "zod";

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const optionalStringSchema = z.string().nullable().optional();

const optionalUrlSchema = optionalStringSchema.refine(
  (value) => value == null || value.trim() === "" || isUrl(value),
  {
    message: "Must be a valid URL"
  }
);

const optionalDateOnlySchema = optionalStringSchema.refine(
  (value) => value == null || value.trim() === "" || isDateOnly(value),
  {
    message: "Must be a date in YYYY-MM-DD format"
  }
);

export const updateProfileBodySchema = z.object({
  headline: optionalStringSchema,
  summary: optionalStringSchema,
  location: optionalStringSchema,
  avatarImageUrl: optionalUrlSchema,
  version: z.coerce.number().int().min(1)
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

export const attributeIdParamsSchema = z.object({
  attributeId: z.string().trim().min(1)
});

export type AttributeIdParams = z.infer<typeof attributeIdParamsSchema>;

export const updateAttributeValueBodySchema = z.object({
  stringValue: optionalStringSchema,
  textValue: optionalStringSchema,
  imageUrl: optionalUrlSchema,
  numericValue: z.union([z.string(), z.number(), z.null()]).optional(),
  dateValue: optionalDateOnlySchema,
  periodStart: optionalDateOnlySchema,
  periodEnd: optionalDateOnlySchema,
  booleanValue: z.boolean().nullable().optional(),
  selectedOptionId: optionalStringSchema,
  version: z.coerce.number().int().min(1).optional()
});

export type UpdateAttributeValueBody = z.infer<typeof updateAttributeValueBodySchema>;

export const projectIdParamsSchema = z.object({
  projectId: z.string().trim().min(1)
});

export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;

export const createProjectBodySchema = z.object({
  title: z.string().trim().min(1),
  description: optionalStringSchema,
  role: optionalStringSchema,
  url: optionalUrlSchema,
  startDate: optionalDateOnlySchema,
  endDate: optionalDateOnlySchema,
  isCurrent: z.boolean().optional(),
  tagNames: z.array(z.string()).optional()
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export const updateProjectBodySchema = createProjectBodySchema.extend({
  version: z.coerce.number().int().min(1)
});

export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;

export const deleteProjectQuerySchema = z.object({
  version: z.coerce.number().int().min(1)
});

export type DeleteProjectQuery = z.infer<typeof deleteProjectQuerySchema>;

export const listProjectTagsQuerySchema = z.object({
  prefix: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListProjectTagsQuery = z.infer<typeof listProjectTagsQuerySchema>;
