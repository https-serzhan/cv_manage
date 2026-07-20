import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { currentUserQueryKey } from "../../user/api/current-user";
import { getAdminUserById, getAdminUsers, updateAdminUserRoles } from "../api/adminUsersApi";
import type { GetAdminUsersParams, UpdateAdminUserRolesPayload } from "./types";

export const adminUserQueryKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserQueryKeys.all, "list"] as const,
  list: (params: GetAdminUsersParams) => [...adminUserQueryKeys.lists(), params] as const,
  details: () => [...adminUserQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...adminUserQueryKeys.details(), id] as const
};

export function useAdminUsersQuery(params: GetAdminUsersParams = {}) {
  return useQuery({
    queryKey: adminUserQueryKeys.list(params),
    queryFn: () => getAdminUsers(params)
  });
}

export function useAdminUserQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: adminUserQueryKeys.detail(id),
    queryFn: () => getAdminUserById(id),
    enabled: Boolean(id) && enabled
  });
}

type UpdateAdminUserRolesVariables = {
  id: string;
  payload: UpdateAdminUserRolesPayload;
};

export function useUpdateAdminUserRolesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateAdminUserRolesVariables) =>
      updateAdminUserRoles(id, payload),
    onSuccess: (updatedUser) => {
      void queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.detail(updatedUser.id) });
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    }
  });
}
