import { PositionAccessMode } from "@prisma/client";

import { AppError } from "../../shared/errors/app-error.js";
import { positionsRepository } from "./positions.repository.js";
import type {
  PositionAttributeData,
  PositionData,
  PositionAccessRecord,
  PositionRecord,
  PositionVisibility
} from "./positions.repository.js";
import type {
  CreatePositionBody,
  DuplicatePositionBody,
  ListPositionsQuery,
  UpdatePositionAccessBody,
  UpdatePositionBody
} from "./positions.validation.js";

type PositionBody = CreatePositionBody | UpdatePositionBody;
export type PositionViewer = {
  userId: string;
  roleCodes: string[];
} | null;

function canSeeAllPositions(viewer: PositionViewer): boolean {
  return Boolean(
    viewer?.roleCodes.some((roleCode) => roleCode === "RECRUITER" || roleCode === "ADMIN")
  );
}

function toPositionVisibility(viewer: PositionViewer): PositionVisibility {
  return viewer
    ? {
        userId: viewer.userId,
        canSeeAll: canSeeAllPositions(viewer)
      }
    : null;
}

function optionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
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

function normalizeCandidateIds(
  accessMode: PositionAccessMode,
  candidateUserIds: string[] | undefined
): string[] {
  if (accessMode === PositionAccessMode.PUBLIC) {
    return [];
  }

  const seen = new Set<string>();
  const normalizedIds: string[] = [];

  for (const candidateUserId of candidateUserIds ?? []) {
    const normalized = candidateUserId.trim();

    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      normalizedIds.push(normalized);
    }
  }

  return normalizedIds;
}

function normalizePositionData(data: PositionBody): PositionData {
  return {
    title: data.title.trim(),
    description: optionalString(data.description),
    accessMode: data.accessMode,
    maxProjects: data.maxProjects ?? null
  };
}

function normalizePositionAttributes(data: PositionBody): PositionAttributeData[] {
  return data.attributes.map((attribute) => ({
    attributeId: attribute.attributeId,
    isRequired: attribute.isRequired ?? true
  }));
}

function toPositionDto(position: PositionRecord) {
  return {
    id: position.id,
    title: position.title,
    description: position.description,
    accessMode: position.accessMode,
    maxProjects: position.maxProjects,
    createdBy: position.createdBy,
    attributes: position.attributes.map((attribute) => ({
      attribute: attribute.attribute,
      sortOrder: attribute.sortOrder,
      isRequired: attribute.isRequired
    })),
    projectTags: position.projectTags
      .map(({ tag }) => tag)
      .sort((left, right) => left.name.localeCompare(right.name)),
    candidateAccessCount: position._count.candidateAccess,
    createdAt: position.createdAt.toISOString(),
    updatedAt: position.updatedAt.toISOString(),
    version: position.version
  };
}

function toPositionAccessDto(position: PositionAccessRecord) {
  return {
    positionId: position.id,
    accessMode: position.accessMode,
    allowedCandidates: position.candidateAccess
      .map(({ candidate }) => candidate)
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
  };
}

async function validateAttributes(attributes: PositionAttributeData[]) {
  const attributeIds = attributes.map((attribute) => attribute.attributeId);
  const existingAttributes = await positionsRepository.findAttributeIds(attributeIds);

  if (existingAttributes.length !== attributeIds.length) {
    throw new AppError(400, "Some attributes were not found");
  }
}

async function validateCandidateUsers(candidateUserIds: string[]) {
  const candidateUsers = await positionsRepository.findCandidateUserIds(candidateUserIds);

  if (candidateUsers.length !== candidateUserIds.length) {
    throw new AppError(400, "Some allowed candidates were not found or are not candidates");
  }
}

async function normalizePositionInput(data: PositionBody) {
  const positionData = normalizePositionData(data);
  const attributes = normalizePositionAttributes(data);
  const tagNames = normalizeTagNames(data.projectTagNames);
  const candidateUserIds = normalizeCandidateIds(data.accessMode, data.allowedCandidateUserIds);

  await validateAttributes(attributes);
  await validateCandidateUsers(candidateUserIds);

  return {
    positionData,
    attributes,
    tagNames,
    candidateUserIds
  };
}

export const positionsService = {
  async getPositions(filters: ListPositionsQuery, viewer: PositionViewer) {
    const result = await positionsRepository.findPositions(filters, toPositionVisibility(viewer));

    return {
      items: result.items.map(toPositionDto),
      pagination: result.pagination
    };
  },
  async getPositionById(id: string, viewer: PositionViewer) {
    const position = await positionsRepository.findVisiblePositionById(
      id,
      toPositionVisibility(viewer)
    );

    if (!position) {
      throw new AppError(404, "Position not found");
    }

    return toPositionDto(position);
  },
  async createPosition(createdById: string, data: CreatePositionBody) {
    const input = await normalizePositionInput(data);
    const position = await positionsRepository.createPosition(
      {
        ...input.positionData,
        createdById
      },
      input.attributes,
      input.tagNames,
      input.candidateUserIds
    );

    return toPositionDto(position);
  },
  async updatePosition(id: string, data: UpdatePositionBody) {
    const existingPosition = await positionsRepository.findPositionById(id);

    if (!existingPosition) {
      throw new AppError(404, "Position not found");
    }

    const input = await normalizePositionInput(data);
    const position = await positionsRepository.updatePositionWithVersion(
      id,
      data.version,
      input.positionData,
      input.attributes,
      input.tagNames,
      input.candidateUserIds
    );

    if (!position) {
      throw new AppError(409, "Position version mismatch");
    }

    return toPositionDto(position);
  },
  async deletePosition(id: string, version: number) {
    const existingPosition = await positionsRepository.findPositionById(id);

    if (!existingPosition) {
      throw new AppError(404, "Position not found");
    }

    const deletedCount = await positionsRepository.deletePositionWithVersion(id, version);

    if (deletedCount === 0) {
      throw new AppError(409, "Position version mismatch");
    }
  },
  async duplicatePosition(id: string, createdById: string, data: DuplicatePositionBody) {
    const existingPosition = await positionsRepository.findPositionById(id);

    if (!existingPosition) {
      throw new AppError(404, "Position not found");
    }

    const title = optionalString(data.title) ?? `Copy of ${existingPosition.title}`;
    const position = await positionsRepository.duplicatePosition(id, title, createdById);

    if (!position) {
      throw new AppError(404, "Position not found");
    }

    return toPositionDto(position);
  },
  async getPositionAccess(id: string) {
    const position = await positionsRepository.findPositionAccess(id);

    if (!position) {
      throw new AppError(404, "Position not found");
    }

    return toPositionAccessDto(position);
  },
  async updatePositionAccess(id: string, data: UpdatePositionAccessBody) {
    const existingPosition = await positionsRepository.findPositionById(id);

    if (!existingPosition) {
      throw new AppError(404, "Position not found");
    }

    const candidateUserIds = normalizeCandidateIds(data.accessMode, data.allowedCandidateUserIds);

    await validateCandidateUsers(candidateUserIds);

    const position = await positionsRepository.updateAccessWithVersion(
      id,
      data.version,
      data.accessMode,
      candidateUserIds
    );

    if (!position) {
      throw new AppError(409, "Position version mismatch");
    }

    return toPositionAccessDto(position);
  }
};
