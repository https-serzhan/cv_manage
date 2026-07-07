import type { Prisma } from "@prisma/client";

import { prisma } from "../../shared/db/prisma.js";

const cvPositionSelect = {
  id: true,
  title: true,
  description: true,
  accessMode: true,
  maxProjects: true,
  attributes: {
    select: {
      isRequired: true,
      sortOrder: true,
      attribute: {
        select: {
          id: true,
          name: true,
          type: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      sortOrder: "asc"
    }
  },
  projectTags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  candidateAccess: {
    select: {
      candidateUserId: true
    }
  }
} satisfies Prisma.PositionSelect;

const cvCandidateProfileSelect = {
  id: true,
  headline: true,
  summary: true,
  location: true,
  avatarImageUrl: true,
  user: {
    select: {
      id: true,
      displayName: true,
      email: true
    }
  }
} satisfies Prisma.CandidateProfileSelect;

const cvAttributeValueSelect = {
  attributeId: true,
  stringValue: true,
  textValue: true,
  imageUrl: true,
  numericValue: true,
  dateValue: true,
  periodStart: true,
  periodEnd: true,
  booleanValue: true,
  selectedOption: {
    select: {
      id: true,
      value: true,
      sortOrder: true
    }
  }
} satisfies Prisma.CandidateAttributeValueSelect;

const cvProjectSelect = {
  id: true,
  title: true,
  description: true,
  role: true,
  url: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  updatedAt: true,
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.CandidateProjectSelect;

export type CvPositionRecord = Prisma.PositionGetPayload<{ select: typeof cvPositionSelect }>;
export type CvCandidateProfileRecord = Prisma.CandidateProfileGetPayload<{
  select: typeof cvCandidateProfileSelect;
}>;
export type CvAttributeValueRecord = Prisma.CandidateAttributeValueGetPayload<{
  select: typeof cvAttributeValueSelect;
}>;
export type CvProjectRecord = Prisma.CandidateProjectGetPayload<{ select: typeof cvProjectSelect }>;

export const cvsRepository = {
  findPositionForPreview(positionId: string) {
    return prisma.position.findUnique({
      where: { id: positionId },
      select: cvPositionSelect
    });
  },
  ensureCandidateProfileForPreview(userId: string) {
    return prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: cvCandidateProfileSelect
    });
  },
  findCandidateAttributeValues(candidateProfileId: string, attributeIds: string[]) {
    return prisma.candidateAttributeValue.findMany({
      where: {
        candidateProfileId,
        attributeId: {
          in: attributeIds
        }
      },
      select: cvAttributeValueSelect
    });
  },
  findCandidateProjects(candidateProfileId: string) {
    return prisma.candidateProject.findMany({
      where: { candidateProfileId },
      select: cvProjectSelect
    });
  }
};
