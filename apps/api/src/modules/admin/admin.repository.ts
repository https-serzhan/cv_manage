import type { Prisma } from "@prisma/client";

import { prisma } from "../../shared/db/prisma.js";
import type { AdminRoleCode, ListAdminUsersQuery } from "./admin.validation.js";

const adminUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: {
        select: {
          id: true,
          code: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.UserSelect;

export type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

export const adminRepository = {
  async findUsers(filters: ListAdminUsersQuery) {
    const { prefix, role, page, pageSize } = filters;
    const where: Prisma.UserWhereInput = {};

    if (prefix) {
      where.OR = [
        {
          displayName: {
            contains: prefix,
            mode: "insensitive"
          }
        },
        {
          email: {
            contains: prefix,
            mode: "insensitive"
          }
        }
      ];
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            code: role
          }
        }
      };
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc"
        },
        select: adminUserSelect
      }),
      prisma.user.count({ where })
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
  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: adminUserSelect
    });
  },
  findRolesByCodes(codes: AdminRoleCode[]) {
    return prisma.role.findMany({
      where: {
        code: {
          in: codes
        }
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    });
  },
  countAdminUsers() {
    return prisma.user.count({
      where: {
        roles: {
          some: {
            role: {
              code: "ADMIN"
            }
          }
        }
      }
    });
  },
  updateUserRoles(userId: string, roleIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId }
      });

      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId
        }))
      });

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: adminUserSelect
      });
    });
  }
};
