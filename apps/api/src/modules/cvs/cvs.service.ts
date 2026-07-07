import { AttributeType, PositionAccessMode } from "@prisma/client";

import { AppError } from "../../shared/errors/app-error.js";
import { cvsRepository } from "./cvs.repository.js";
import type {
  CvAttributeValueRecord,
  CvCandidateProfileRecord,
  CvPositionRecord,
  CvProjectRecord
} from "./cvs.repository.js";

type CvAttributeValue = string | boolean | null;
type CvMissingRequiredAttribute = {
  attributeId: string;
  name: string;
  type: AttributeType;
};

function dateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function optionalString(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function periodDisplay(start: Date | null, end: Date | null): string | null {
  const startValue = dateOnly(start);
  const endValue = dateOnly(end);

  if (startValue && endValue) {
    return `${startValue} - ${endValue}`;
  }

  if (startValue) {
    return `${startValue} - Present`;
  }

  if (endValue) {
    return `Until ${endValue}`;
  }

  return null;
}

function formatAttributeValue(
  type: AttributeType,
  value: CvAttributeValueRecord | undefined
): { value: CvAttributeValue; displayValue: string | null } {
  if (!value) {
    return {
      value: null,
      displayValue: null
    };
  }

  if (type === AttributeType.STRING) {
    const stringValue = optionalString(value.stringValue);

    return {
      value: stringValue,
      displayValue: stringValue
    };
  }

  if (type === AttributeType.TEXT) {
    const textValue = optionalString(value.textValue);

    return {
      value: textValue,
      displayValue: textValue
    };
  }

  if (type === AttributeType.IMAGE) {
    const imageUrl = optionalString(value.imageUrl);

    return {
      value: imageUrl,
      displayValue: imageUrl
    };
  }

  if (type === AttributeType.NUMERIC) {
    const numericValue = value.numericValue?.toString() ?? null;

    return {
      value: numericValue,
      displayValue: numericValue
    };
  }

  if (type === AttributeType.DATE) {
    const dateValue = dateOnly(value.dateValue);

    return {
      value: dateValue,
      displayValue: dateValue
    };
  }

  if (type === AttributeType.PERIOD) {
    const periodValue = periodDisplay(value.periodStart, value.periodEnd);

    return {
      value: periodValue,
      displayValue: periodValue
    };
  }

  if (type === AttributeType.BOOLEAN) {
    return {
      value: value.booleanValue ?? null,
      displayValue: value.booleanValue == null ? null : value.booleanValue ? "Yes" : "No"
    };
  }

  const dropdownValue = value.selectedOption?.value ?? null;

  return {
    value: dropdownValue,
    displayValue: dropdownValue
  };
}

function isMeaningfulValue(value: CvAttributeValue): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null;
}

function projectDateTime(value: Date | null): number {
  return value?.getTime() ?? 0;
}

function compareProjects(left: CvProjectRecord, right: CvProjectRecord): number {
  if (left.isCurrent !== right.isCurrent) {
    return left.isCurrent ? -1 : 1;
  }

  return (
    projectDateTime(right.endDate) - projectDateTime(left.endDate) ||
    projectDateTime(right.startDate) - projectDateTime(left.startDate) ||
    right.updatedAt.getTime() - left.updatedAt.getTime()
  );
}

function toProjectDto(project: CvProjectRecord) {
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
      .sort((left, right) => left.name.localeCompare(right.name))
  };
}

function filterProjects(position: CvPositionRecord, projects: CvProjectRecord[]) {
  const projectTagIds = new Set(position.projectTags.map(({ tag }) => tag.id));
  const filteredProjects =
    projectTagIds.size === 0
      ? projects
      : projects.filter((project) => project.tags.some(({ tag }) => projectTagIds.has(tag.id)));

  const sortedProjects = [...filteredProjects].sort(compareProjects);

  return position.maxProjects == null
    ? sortedProjects
    : sortedProjects.slice(0, position.maxProjects);
}

function toCandidateDto(profile: CvCandidateProfileRecord) {
  return {
    id: profile.user.id,
    displayName: profile.user.displayName,
    email: profile.user.email,
    profile: {
      headline: profile.headline,
      summary: profile.summary,
      location: profile.location,
      avatarImageUrl: profile.avatarImageUrl
    }
  };
}

function canPreviewPosition(position: CvPositionRecord, userId: string): boolean {
  if (position.accessMode === PositionAccessMode.PUBLIC) {
    return true;
  }

  return position.candidateAccess.some((access) => access.candidateUserId === userId);
}

export const cvsService = {
  async getPreview(positionId: string, userId: string) {
    const position = await cvsRepository.findPositionForPreview(positionId);

    if (!position) {
      throw new AppError(404, "Position not found");
    }

    if (!canPreviewPosition(position, userId)) {
      throw new AppError(403, "Position access denied");
    }

    const profile = await cvsRepository.ensureCandidateProfileForPreview(userId);
    const attributeIds = position.attributes.map(({ attribute }) => attribute.id);
    const [attributeValues, projects] = await Promise.all([
      cvsRepository.findCandidateAttributeValues(profile.id, attributeIds),
      cvsRepository.findCandidateProjects(profile.id)
    ]);
    const valueByAttributeId = new Map(attributeValues.map((value) => [value.attributeId, value]));
    const missingRequiredAttributes: CvMissingRequiredAttribute[] = [];

    const attributes = position.attributes.map((positionAttribute) => {
      const attribute = positionAttribute.attribute;
      const formattedValue = formatAttributeValue(
        attribute.type,
        valueByAttributeId.get(attribute.id)
      );

      if (positionAttribute.isRequired && !isMeaningfulValue(formattedValue.value)) {
        missingRequiredAttributes.push({
          attributeId: attribute.id,
          name: attribute.name,
          type: attribute.type
        });
      }

      return {
        attributeId: attribute.id,
        name: attribute.name,
        type: attribute.type,
        category: attribute.category,
        isRequired: positionAttribute.isRequired,
        value: formattedValue.value,
        displayValue: formattedValue.displayValue
      };
    });

    return {
      position: {
        id: position.id,
        title: position.title,
        description: position.description,
        accessMode: position.accessMode,
        maxProjects: position.maxProjects,
        projectTags: position.projectTags
          .map(({ tag }) => tag)
          .sort((left, right) => left.name.localeCompare(right.name))
      },
      candidate: toCandidateDto(profile),
      attributes,
      projects: filterProjects(position, projects).map(toProjectDto),
      missingRequiredAttributes,
      generatedAt: new Date().toISOString()
    };
  }
};
