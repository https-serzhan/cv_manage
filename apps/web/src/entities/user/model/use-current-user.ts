import { useQuery } from "@tanstack/react-query";

import { currentUserQueryKey, getCurrentUser } from "../api/current-user";

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 60_000
  });
}
