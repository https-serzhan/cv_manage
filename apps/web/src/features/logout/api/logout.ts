import { apiRequest } from "../../../shared/api/client";
import type { CurrentUserResponse } from "../../../entities/user/model/types";

export function logout() {
  return apiRequest<CurrentUserResponse>("/auth/logout", {
    method: "POST"
  });
}
