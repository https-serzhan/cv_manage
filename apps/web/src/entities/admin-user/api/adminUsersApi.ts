import { apiRequest } from "../../../shared/api/client";

import type {
  AdminUser,
  AdminUsersListResponse,
  GetAdminUsersParams,
  UpdateAdminUserRolesPayload
} from "../model/types";

function buildQueryString(params: GetAdminUsersParams = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function getAdminUsers(params: GetAdminUsersParams = {}) {
  return apiRequest<AdminUsersListResponse>(`/api/admin/users${buildQueryString(params)}`);
}

export function getAdminUserById(id: string) {
  return apiRequest<AdminUser>(`/api/admin/users/${id}`);
}

export function updateAdminUserRoles(id: string, payload: UpdateAdminUserRolesPayload) {
  return apiRequest<AdminUser>(`/api/admin/users/${id}/roles`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
