import { apiRequest } from "../../../shared/api/client";
import type { CurrentUserResponse } from "../model/types";

export const currentUserQueryKey = ["current-user"] as const;

export function getCurrentUser() {
  return apiRequest<CurrentUserResponse>("/auth/me", {
    method: "GET"
  });
}
