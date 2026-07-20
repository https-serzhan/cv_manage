import { AppError } from "../../shared/errors/app-error.js";
import { adminRepository } from "./admin.repository.js";
import type { AdminUserRecord } from "./admin.repository.js";
import type {
  AdminRoleCode,
  ListAdminUsersQuery,
  UpdateAdminUserRolesBody
} from "./admin.validation.js";

function toAdminUserDto(user: AdminUserRecord) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    roles: user.roles
      .map(({ role }) => ({
        code: role.code as AdminRoleCode,
        name: role.name
      }))
      .sort((left, right) => left.code.localeCompare(right.code)),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

function hasAdminRole(user: AdminUserRecord): boolean {
  return user.roles.some(({ role }) => role.code === "ADMIN");
}

export const adminService = {
  async getUsers(filters: ListAdminUsersQuery) {
    const result = await adminRepository.findUsers(filters);

    return {
      items: result.items.map(toAdminUserDto),
      pagination: result.pagination
    };
  },
  async getUserById(id: string) {
    const user = await adminRepository.findUserById(id);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return toAdminUserDto(user);
  },
  async updateUserRoles(currentAdminId: string, userId: string, data: UpdateAdminUserRolesBody) {
    const user = await adminRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const nextRoleCodes = data.roles;
    const removesAdmin = hasAdminRole(user) && !nextRoleCodes.includes("ADMIN");

    if (currentAdminId === userId && removesAdmin) {
      throw new AppError(409, "You cannot remove your own ADMIN role");
    }

    if (removesAdmin) {
      const adminCount = await adminRepository.countAdminUsers();

      if (adminCount <= 1) {
        throw new AppError(409, "At least one ADMIN user is required");
      }
    }

    const roles = await adminRepository.findRolesByCodes(nextRoleCodes);

    if (roles.length !== nextRoleCodes.length) {
      throw new AppError(400, "One or more roles do not exist");
    }

    const roleIdsByCode = new Map(roles.map((role) => [role.code, role.id]));
    const roleIds = nextRoleCodes.map((roleCode) => {
      const roleId = roleIdsByCode.get(roleCode);

      if (!roleId) {
        throw new AppError(400, "One or more roles do not exist");
      }

      return roleId;
    });
    const updatedUser = await adminRepository.updateUserRoles(userId, roleIds);

    return toAdminUserDto(updatedUser);
  }
};
