import type { Prisma } from "@prisma/client";

import { prisma } from "../../shared/db/prisma.js";
import type { ListProjectTagsQuery } from "./profile.validation.js";

const profileSelect = {
  id: true,
  headline: true,
  summary: true,
  location: true,
  avatarImageUrl: true,
  createdAt: true,
  updatedAt: true,
  version: true
} satisfies Prisma.CandidateProfileSelect;

const attributeValueSelect = {
  id: true,
  stringValue: true,
  textValue: true,
  imageUrl: true,
  numericValue: true,
  dateValue: true,
  periodStart: true,
  periodEnd: true,
  booleanValue: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  attribute: {
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  selectedOption: {
    select: {
      id: true,
      value: true,
      sortOrder: true
    }
  }
} satisfies Prisma.CandidateAttributeValueSelect;

const attributeForValueSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
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
    }
  }
} satisfies Prisma.AttributeSelect;

const projectSelect = {
  id: true,
  title: true,
  description: true,
  role: true,
  url: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  createdAt: true,
  updatedAt: true,
  version: true,
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

export type ProfileUpdateData = {
  headline: string | null;
  summary: string | null;
  location: string | null;
  avatarImageUrl: string | null;
};

export type AttributeValueData = {
  stringValue: string | null;
  textValue: string | null;
  imageUrl: string | null;
  numericValue: Prisma.Decimal | null;
  dateValue: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  booleanValue: boolean | null;
  selectedOptionId: string | null;
};

export type ProjectData = {
  title: string;
  description: string | null;
  role: string | null;
  url: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
};

type ProjectTag = {
  id: string;
  name: string;
};

async function findOrCreateTags(
  tx: Prisma.TransactionClient,
  tagNames: string[]
): Promise<ProjectTag[]> {
  if (tagNames.length === 0) {
    return [];
  }

  const where = {
    OR: tagNames.map((name) => ({
      name: {
        equals: name,
        mode: "insensitive" as const
      }
    }))
  };

  const existingTags = await tx.projectTag.findMany({
    where,
    select: {
      id: true,
      name: true
    }
  });
  const existingNames = new Set(existingTags.map((tag) => tag.name.toLowerCase()));
  const missingTags = tagNames
    .filter((name) => !existingNames.has(name.toLowerCase()))
    .map((name) => ({ name }));

  if (missingTags.length > 0) {
    await tx.projectTag.createMany({
      data: missingTags,
      skipDuplicates: true
    });
  }

  return tx.projectTag.findMany({
    where,
    select: {
      id: true,
      name: true
    }
  });
}

async function replaceProjectTags(
  tx: Prisma.TransactionClient,
  projectId: string,
  tagNames: string[]
) {
  await tx.candidateProjectTag.deleteMany({
    where: { projectId }
  });

  const tags = await findOrCreateTags(tx, tagNames);

  if (tags.length > 0) {
    await tx.candidateProjectTag.createMany({
      data: tags.map((tag) => ({
        projectId,
        tagId: tag.id
      })),
      skipDuplicates: true
    });
  }
}

export const profileRepository = {
  ensureCandidateProfile(userId: string) {
    return prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: profileSelect
    });
  },
  findCandidateProfileByUserId(userId: string) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      select: profileSelect
    });
  },
  findCandidateProfileIdByUserId(userId: string) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        id: true
      }
    });
  },
  async updateProfileWithVersion(userId: string, version: number, data: ProfileUpdateData) {
    const result = await prisma.candidateProfile.updateMany({
      where: {
        userId,
        version
      },
      data: {
        ...data,
        version: {
          increment: 1
        }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.candidateProfile.findUnique({
      where: { userId },
      select: profileSelect
    });
  },
  findAttributeForValue(attributeId: string) {
    return prisma.attribute.findUnique({
      where: { id: attributeId },
      select: attributeForValueSelect
    });
  },
  findAttributeOption(attributeId: string, optionId: string) {
    return prisma.attributeOption.findFirst({
      where: {
        id: optionId,
        attributeId
      },
      select: {
        id: true,
        value: true,
        sortOrder: true
      }
    });
  },
  findAttributeValues(candidateProfileId: string) {
    return prisma.candidateAttributeValue.findMany({
      where: { candidateProfileId },
      orderBy: {
        updatedAt: "desc"
      },
      select: attributeValueSelect
    });
  },
  findAttributeValue(candidateProfileId: string, attributeId: string) {
    return prisma.candidateAttributeValue.findUnique({
      where: {
        candidateProfileId_attributeId: {
          candidateProfileId,
          attributeId
        }
      },
      select: attributeValueSelect
    });
  },
  createAttributeValue(candidateProfileId: string, attributeId: string, data: AttributeValueData) {
    return prisma.candidateAttributeValue.create({
      data: {
        candidateProfileId,
        attributeId,
        ...data
      },
      select: attributeValueSelect
    });
  },
  async updateAttributeValueWithVersion(
    candidateProfileId: string,
    attributeId: string,
    version: number,
    data: AttributeValueData
  ) {
    const result = await prisma.candidateAttributeValue.updateMany({
      where: {
        candidateProfileId,
        attributeId,
        version
      },
      data: {
        ...data,
        version: {
          increment: 1
        }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.candidateAttributeValue.findUnique({
      where: {
        candidateProfileId_attributeId: {
          candidateProfileId,
          attributeId
        }
      },
      select: attributeValueSelect
    });
  },
  findProjects(candidateProfileId: string) {
    return prisma.candidateProject.findMany({
      where: { candidateProfileId },
      orderBy: {
        updatedAt: "desc"
      },
      select: projectSelect
    });
  },
  findProject(candidateProfileId: string, projectId: string) {
    return prisma.candidateProject.findFirst({
      where: {
        id: projectId,
        candidateProfileId
      },
      select: projectSelect
    });
  },
  createProject(candidateProfileId: string, data: ProjectData, tagNames: string[]) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.candidateProject.create({
        data: {
          candidateProfileId,
          title: data.title,
          description: data.description,
          role: data.role,
          url: data.url,
          startDate: data.startDate,
          endDate: data.endDate,
          isCurrent: data.isCurrent
        },
        select: {
          id: true
        }
      });

      await replaceProjectTags(tx, project.id, tagNames);

      return tx.candidateProject.findUniqueOrThrow({
        where: { id: project.id },
        select: projectSelect
      });
    });
  },
  async updateProjectWithVersion(
    candidateProfileId: string,
    projectId: string,
    version: number,
    data: ProjectData,
    tagNames: string[]
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.candidateProject.updateMany({
        where: {
          id: projectId,
          candidateProfileId,
          version
        },
        data: {
          title: data.title,
          description: data.description,
          role: data.role,
          url: data.url,
          startDate: data.startDate,
          endDate: data.endDate,
          isCurrent: data.isCurrent,
          version: {
            increment: 1
          }
        }
      });

      if (result.count === 0) {
        return null;
      }

      await replaceProjectTags(tx, projectId, tagNames);

      return tx.candidateProject.findUniqueOrThrow({
        where: { id: projectId },
        select: projectSelect
      });
    });
  },
  async deleteProjectWithVersion(candidateProfileId: string, projectId: string, version: number) {
    const result = await prisma.candidateProject.deleteMany({
      where: {
        id: projectId,
        candidateProfileId,
        version
      }
    });

    return result.count;
  },
  async findProjectTags(filters: ListProjectTagsQuery) {
    const { prefix, page, pageSize } = filters;
    const where: Prisma.ProjectTagWhereInput = prefix
      ? {
          name: {
            startsWith: prefix,
            mode: "insensitive"
          }
        }
      : {};
    const skip = (page - 1) * pageSize;
    const [items, total] = await prisma.$transaction([
      prisma.projectTag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          name: "asc"
        },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      }),
      prisma.projectTag.count({ where })
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
  }
};
