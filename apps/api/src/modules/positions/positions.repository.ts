import { PositionAccessMode, type Prisma } from "@prisma/client";

import { prisma } from "../../shared/db/prisma.js";
import type { ListPositionsQuery } from "./positions.validation.js";

const positionSelect = {
  id: true,
  title: true,
  description: true,
  accessMode: true,
  maxProjects: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  createdBy: {
    select: {
      id: true,
      displayName: true
    }
  },
  attributes: {
    select: {
      sortOrder: true,
      isRequired: true,
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
  _count: {
    select: {
      candidateAccess: true
    }
  }
} satisfies Prisma.PositionSelect;

const positionAccessSelect = {
  id: true,
  accessMode: true,
  candidateAccess: {
    select: {
      candidate: {
        select: {
          id: true,
          displayName: true,
          email: true
        }
      }
    }
  }
} satisfies Prisma.PositionSelect;

export type PositionRecord = Prisma.PositionGetPayload<{ select: typeof positionSelect }>;
export type PositionAccessRecord = Prisma.PositionGetPayload<{
  select: typeof positionAccessSelect;
}>;

export type PositionData = {
  title: string;
  description: string | null;
  accessMode: PositionAccessMode;
  maxProjects: number | null;
};

export type PositionAttributeData = {
  attributeId: string;
  isRequired: boolean;
};

export type PositionVisibility = {
  userId: string;
  canSeeAll: boolean;
} | null;

type ProjectTag = {
  id: string;
  name: string;
};

function visiblePositionWhere(visibility: PositionVisibility): Prisma.PositionWhereInput {
  if (visibility?.canSeeAll) {
    return {};
  }

  if (!visibility) {
    return {
      accessMode: PositionAccessMode.PUBLIC
    };
  }

  return {
    OR: [
      {
        accessMode: PositionAccessMode.PUBLIC
      },
      {
        candidateAccess: {
          some: {
            candidateUserId: visibility.userId
          }
        }
      }
    ]
  };
}

function applyVisibility(
  where: Prisma.PositionWhereInput,
  visibility: PositionVisibility
): Prisma.PositionWhereInput {
  const visibilityWhere = visiblePositionWhere(visibility);

  return Object.keys(visibilityWhere).length === 0
    ? where
    : {
        AND: [where, visibilityWhere]
      };
}

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

async function replacePositionRelations(
  tx: Prisma.TransactionClient,
  positionId: string,
  attributes: PositionAttributeData[],
  tagNames: string[],
  candidateUserIds: string[],
  accessMode: PositionAccessMode
) {
  await tx.positionAttribute.deleteMany({
    where: { positionId }
  });
  await tx.positionProjectTag.deleteMany({
    where: { positionId }
  });
  await tx.positionCandidateAccess.deleteMany({
    where: { positionId }
  });

  if (attributes.length > 0) {
    await tx.positionAttribute.createMany({
      data: attributes.map((attribute, index) => ({
        positionId,
        attributeId: attribute.attributeId,
        sortOrder: index,
        isRequired: attribute.isRequired
      }))
    });
  }

  const tags = await findOrCreateTags(tx, tagNames);

  if (tags.length > 0) {
    await tx.positionProjectTag.createMany({
      data: tags.map((tag) => ({
        positionId,
        tagId: tag.id
      })),
      skipDuplicates: true
    });
  }

  if (accessMode === PositionAccessMode.RESTRICTED && candidateUserIds.length > 0) {
    await tx.positionCandidateAccess.createMany({
      data: candidateUserIds.map((candidateUserId) => ({
        positionId,
        candidateUserId
      })),
      skipDuplicates: true
    });
  }
}

export const positionsRepository = {
  async findPositions(filters: ListPositionsQuery, visibility: PositionVisibility) {
    const { prefix, accessMode, attributeId, projectTagId, page, pageSize } = filters;
    const filterWhere: Prisma.PositionWhereInput = {};

    if (prefix) {
      filterWhere.title = {
        startsWith: prefix,
        mode: "insensitive"
      };
    }

    if (accessMode) {
      filterWhere.accessMode = accessMode;
    }

    if (attributeId) {
      filterWhere.attributes = {
        some: {
          attributeId
        }
      };
    }

    if (projectTagId) {
      filterWhere.projectTags = {
        some: {
          tagId: projectTagId
        }
      };
    }

    const where = applyVisibility(filterWhere, visibility);
    const skip = (page - 1) * pageSize;
    const [items, total] = await prisma.$transaction([
      prisma.position.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          updatedAt: "desc"
        },
        select: positionSelect
      }),
      prisma.position.count({ where })
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
  findPositionById(id: string) {
    return prisma.position.findUnique({
      where: { id },
      select: positionSelect
    });
  },
  findVisiblePositionById(id: string, visibility: PositionVisibility) {
    return prisma.position.findFirst({
      where: applyVisibility({ id }, visibility),
      select: positionSelect
    });
  },
  async findAttributeIds(attributeIds: string[]) {
    if (attributeIds.length === 0) {
      return [];
    }

    return prisma.attribute.findMany({
      where: {
        id: {
          in: attributeIds
        }
      },
      select: {
        id: true
      }
    });
  },
  async findCandidateUserIds(candidateUserIds: string[]) {
    if (candidateUserIds.length === 0) {
      return [];
    }

    return prisma.user.findMany({
      where: {
        id: {
          in: candidateUserIds
        },
        roles: {
          some: {
            role: {
              code: "CANDIDATE"
            }
          }
        }
      },
      select: {
        id: true
      }
    });
  },
  async createPosition(
    data: PositionData & { createdById: string },
    attributes: PositionAttributeData[],
    tagNames: string[],
    candidateUserIds: string[]
  ) {
    return prisma.$transaction(async (tx) => {
      const position = await tx.position.create({
        data,
        select: {
          id: true
        }
      });

      await replacePositionRelations(
        tx,
        position.id,
        attributes,
        tagNames,
        candidateUserIds,
        data.accessMode
      );

      return tx.position.findUniqueOrThrow({
        where: { id: position.id },
        select: positionSelect
      });
    });
  },
  async updatePositionWithVersion(
    id: string,
    version: number,
    data: PositionData,
    attributes: PositionAttributeData[],
    tagNames: string[],
    candidateUserIds: string[]
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.position.updateMany({
        where: {
          id,
          version
        },
        data: {
          title: data.title,
          description: data.description,
          accessMode: data.accessMode,
          maxProjects: data.maxProjects,
          version: {
            increment: 1
          }
        }
      });

      if (result.count === 0) {
        return null;
      }

      await replacePositionRelations(
        tx,
        id,
        attributes,
        tagNames,
        candidateUserIds,
        data.accessMode
      );

      return tx.position.findUniqueOrThrow({
        where: { id },
        select: positionSelect
      });
    });
  },
  async deletePositionWithVersion(id: string, version: number) {
    const result = await prisma.position.deleteMany({
      where: {
        id,
        version
      }
    });

    return result.count;
  },
  async duplicatePosition(id: string, title: string, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.position.findUnique({
        where: { id },
        select: {
          title: true,
          description: true,
          accessMode: true,
          maxProjects: true,
          attributes: {
            select: {
              attributeId: true,
              sortOrder: true,
              isRequired: true
            },
            orderBy: {
              sortOrder: "asc"
            }
          },
          projectTags: {
            select: {
              tagId: true
            }
          },
          candidateAccess: {
            select: {
              candidateUserId: true
            }
          }
        }
      });

      if (!source) {
        return null;
      }

      const position = await tx.position.create({
        data: {
          title,
          description: source.description,
          accessMode: source.accessMode,
          maxProjects: source.maxProjects,
          createdById
        },
        select: {
          id: true
        }
      });

      if (source.attributes.length > 0) {
        await tx.positionAttribute.createMany({
          data: source.attributes.map((attribute) => ({
            positionId: position.id,
            attributeId: attribute.attributeId,
            sortOrder: attribute.sortOrder,
            isRequired: attribute.isRequired
          }))
        });
      }

      if (source.projectTags.length > 0) {
        await tx.positionProjectTag.createMany({
          data: source.projectTags.map((projectTag) => ({
            positionId: position.id,
            tagId: projectTag.tagId
          })),
          skipDuplicates: true
        });
      }

      if (
        source.accessMode === PositionAccessMode.RESTRICTED &&
        source.candidateAccess.length > 0
      ) {
        await tx.positionCandidateAccess.createMany({
          data: source.candidateAccess.map((access) => ({
            positionId: position.id,
            candidateUserId: access.candidateUserId
          })),
          skipDuplicates: true
        });
      }

      return tx.position.findUniqueOrThrow({
        where: { id: position.id },
        select: positionSelect
      });
    });
  },
  findPositionAccess(id: string) {
    return prisma.position.findUnique({
      where: { id },
      select: positionAccessSelect
    });
  },
  async updateAccessWithVersion(
    id: string,
    version: number,
    accessMode: PositionAccessMode,
    candidateUserIds: string[]
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.position.updateMany({
        where: {
          id,
          version
        },
        data: {
          accessMode,
          version: {
            increment: 1
          }
        }
      });

      if (result.count === 0) {
        return null;
      }

      await tx.positionCandidateAccess.deleteMany({
        where: { positionId: id }
      });

      if (accessMode === PositionAccessMode.RESTRICTED && candidateUserIds.length > 0) {
        await tx.positionCandidateAccess.createMany({
          data: candidateUserIds.map((candidateUserId) => ({
            positionId: id,
            candidateUserId
          })),
          skipDuplicates: true
        });
      }

      return tx.position.findUniqueOrThrow({
        where: { id },
        select: positionAccessSelect
      });
    });
  }
};
