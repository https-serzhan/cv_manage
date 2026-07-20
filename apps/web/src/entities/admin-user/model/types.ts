export type AdminRoleCode = "CANDIDATE" | "RECRUITER" | "ADMIN";

export const adminRoleCodes = [
  "CANDIDATE",
  "RECRUITER",
  "ADMIN"
] as const satisfies AdminRoleCode[];

export type AdminUserRole = {
  code: AdminRoleCode;
  name: string;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: AdminUserRole[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUsersListResponse = {
  items: AdminUser[];
  pagination: AdminUsersPagination;
};

export type GetAdminUsersParams = {
  prefix?: string;
  role?: AdminRoleCode;
  page?: number;
  pageSize?: number;
};

export type UpdateAdminUserRolesPayload = {
  roles: AdminRoleCode[];
};
