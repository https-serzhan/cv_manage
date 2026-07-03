import { AttributeType, Prisma } from "@prisma/client";

import { AppError } from "../../shared/errors/app-error.js";
import { profileRepository } from "./profile.repository.js";
import type { AttributeValueData, ProfileUpdateData, ProjectData } from "./profile.repository.js";
import type {
  CreateProjectBody,
  ListProjectTagsQuery,
  UpdateAttributeValueBody,
  UpdateProfileBody,
  UpdateProjectBody
} from "./profile.validation.js";

type ProfileRecord = {
  id: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  avatarImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

type AttributeValueRecord = {
  id: string;
  stringValue: string | null;
  textValue: string | null;
  imageUrl: string | null;
  numericValue: Prisma.Decimal | null;
  dateValue: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  booleanValue: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  attribute: {
    id: string;
    name: string;
    description: string | null;
    type: AttributeType;
    category: {
      id: string;
      name: string;
    };
  };
  selectedOption: {
    id: string;
    value: string;
    sortOrder: number;
  } | null;
};

type AttributeForValue = {
  id: string;
  type: AttributeType;
  options: Array<{
    id: string;
  }>;
};

type ProjectRecord = {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  url: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
};

function optionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function optionalDate(value: string | null | undefined): Date | null {
  const normalized = optionalString(value);

  return normalized ? new Date(`${normalized}T00:00:00.000Z`) : null;
}

function dateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function parseDecimal(value: string | number | null | undefined): Prisma.Decimal | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  try {
    const decimal = new Prisma.Decimal(value);

    if (!decimal.isFinite()) {
      throw new Error("Invalid numeric value");
    }

    return decimal;
  } catch {
    throw new AppError(400, "numericValue must be a valid number");
  }
}

function toProfileDto(profile: ProfileRecord) {
  return {
    id: profile.id,
    headline: profile.headline,
    summary: profile.summary,
    location: profile.location,
    avatarImageUrl: profile.avatarImageUrl,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    version: profile.version
  };
}

function toAttributeValueDto(value: AttributeValueRecord) {
  return {
    id: value.id,
    attribute: value.attribute,
    stringValue: value.stringValue,
    textValue: value.textValue,
    imageUrl: value.imageUrl,
    numericValue: value.numericValue?.toString() ?? null,
    dateValue: dateOnly(value.dateValue),
    periodStart: dateOnly(value.periodStart),
    periodEnd: dateOnly(value.periodEnd),
    booleanValue: value.booleanValue,
    selectedOption: value.selectedOption,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
    version: value.version
  };
}

function toProjectDto(project: ProjectRecord) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    role: project.role,
    url: project.url,
    startDate: dateOnly(project.startDate),
    endDate: dateOnly(project.endDate),
    isCurrent: project.isCurrent,
    tags: project.tags
      .map(({ tag }) => tag)
      .sort((left, right) => left.name.localeCompare(right.name)),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    version: project.version
  };
}

function normalizeProfile(data: UpdateProfileBody): ProfileUpdateData {
  return {
    headline: optionalString(data.headline),
    summary: optionalString(data.summary),
    location: optionalString(data.location),
    avatarImageUrl: optionalString(data.avatarImageUrl)
  };
}

function emptyAttributeValue(): AttributeValueData {
  return {
    stringValue: null,
    textValue: null,
    imageUrl: null,
    numericValue: null,
    dateValue: null,
    periodStart: null,
    periodEnd: null,
    booleanValue: null,
    selectedOptionId: null
  };
}

function normalizeAttributeValue(
  attribute: AttributeForValue,
  data: UpdateAttributeValueBody
): AttributeValueData {
  const value = emptyAttributeValue();

  if (attribute.type === AttributeType.STRING) {
    value.stringValue = optionalString(data.stringValue);
  }

  if (attribute.type === AttributeType.TEXT) {
    value.textValue = optionalString(data.textValue);
  }

  if (attribute.type === AttributeType.IMAGE) {
    value.imageUrl = optionalString(data.imageUrl);
  }

  if (attribute.type === AttributeType.NUMERIC) {
    value.numericValue = parseDecimal(data.numericValue);
  }

  if (attribute.type === AttributeType.DATE) {
    value.dateValue = optionalDate(data.dateValue);
  }

  if (attribute.type === AttributeType.PERIOD) {
    value.periodStart = optionalDate(data.periodStart);
    value.periodEnd = optionalDate(data.periodEnd);
  }

  if (attribute.type === AttributeType.BOOLEAN) {
    value.booleanValue = data.booleanValue ?? null;
  }

  if (attribute.type === AttributeType.DROPDOWN) {
    const selectedOptionId = optionalString(data.selectedOptionId);

    if (selectedOptionId && !attribute.options.some((option) => option.id === selectedOptionId)) {
      throw new AppError(400, "Selected option does not belong to attribute");
    }

    value.selectedOptionId = selectedOptionId;
  }

  return value;
}

function normalizeTagNames(tagNames: string[] | undefined): string[] {
  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tagName of tagNames ?? []) {
    const normalized = tagName.trim();
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      seen.add(key);
      normalizedTags.push(normalized);
    }
  }

  return normalizedTags;
}

function normalizeProject(data: CreateProjectBody | UpdateProjectBody): ProjectData {
  const isCurrent = data.isCurrent ?? false;
  const startDate = optionalDate(data.startDate);
  const endDate = isCurrent ? null : optionalDate(data.endDate);

  if (startDate && endDate && endDate < startDate) {
    throw new AppError(400, "endDate must not be before startDate");
  }

  return {
    title: data.title.trim(),
    description: optionalString(data.description),
    role: optionalString(data.role),
    url: optionalString(data.url),
    startDate,
    endDate,
    isCurrent
  };
}

export const profileService = {
  async getMyProfile(userId: string) {
    const profile = await profileRepository.ensureCandidateProfile(userId);

    return toProfileDto(profile);
  },
  async updateMyProfile(userId: string, data: UpdateProfileBody) {
    await profileRepository.ensureCandidateProfile(userId);

    const profile = await profileRepository.updateProfileWithVersion(
      userId,
      data.version,
      normalizeProfile(data)
    );

    if (!profile) {
      throw new AppError(409, "Candidate profile version mismatch");
    }

    return toProfileDto(profile);
  },
  async getMyAttributeValues(userId: string) {
    const profile = await profileRepository.ensureCandidateProfile(userId);
    const values = await profileRepository.findAttributeValues(profile.id);

    return values.map(toAttributeValueDto);
  },
  async saveMyAttributeValue(userId: string, attributeId: string, data: UpdateAttributeValueBody) {
    const profile = await profileRepository.ensureCandidateProfile(userId);
    const attribute = await profileRepository.findAttributeForValue(attributeId);

    if (!attribute) {
      throw new AppError(404, "Attribute not found");
    }

    const existingValue = await profileRepository.findAttributeValue(profile.id, attributeId);
    const normalizedValue = normalizeAttributeValue(attribute, data);

    if (!existingValue) {
      const createdValue = await profileRepository.createAttributeValue(
        profile.id,
        attributeId,
        normalizedValue
      );

      return toAttributeValueDto(createdValue);
    }

    if (!data.version) {
      throw new AppError(400, "version is required when updating an existing attribute value");
    }

    const updatedValue = await profileRepository.updateAttributeValueWithVersion(
      profile.id,
      attributeId,
      data.version,
      normalizedValue
    );

    if (!updatedValue) {
      throw new AppError(409, "Attribute value version mismatch");
    }

    return toAttributeValueDto(updatedValue);
  },
  async getMyProjects(userId: string) {
    const profile = await profileRepository.ensureCandidateProfile(userId);
    const projects = await profileRepository.findProjects(profile.id);

    return projects.map(toProjectDto);
  },
  async createMyProject(userId: string, data: CreateProjectBody) {
    const profile = await profileRepository.ensureCandidateProfile(userId);
    const project = await profileRepository.createProject(
      profile.id,
      normalizeProject(data),
      normalizeTagNames(data.tagNames)
    );

    return toProjectDto(project);
  },
  async updateMyProject(userId: string, projectId: string, data: UpdateProjectBody) {
    const profile = await profileRepository.ensureCandidateProfile(userId);
    const existingProject = await profileRepository.findProject(profile.id, projectId);

    if (!existingProject) {
      throw new AppError(404, "Project not found");
    }

    const project = await profileRepository.updateProjectWithVersion(
      profile.id,
      projectId,
      data.version,
      normalizeProject(data),
      normalizeTagNames(data.tagNames)
    );

    if (!project) {
      throw new AppError(409, "Project version mismatch");
    }

    return toProjectDto(project);
  },
  async deleteMyProject(userId: string, projectId: string, version: number) {
    const profile = await profileRepository.ensureCandidateProfile(userId);
    const existingProject = await profileRepository.findProject(profile.id, projectId);

    if (!existingProject) {
      throw new AppError(404, "Project not found");
    }

    const deletedCount = await profileRepository.deleteProjectWithVersion(
      profile.id,
      projectId,
      version
    );

    if (deletedCount === 0) {
      throw new AppError(409, "Project version mismatch");
    }
  },
  async getProjectTags(filters: ListProjectTagsQuery) {
    const result = await profileRepository.findProjectTags(filters);

    return {
      items: result.items.map((tag) => ({
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString()
      })),
      pagination: result.pagination
    };
  }
};
