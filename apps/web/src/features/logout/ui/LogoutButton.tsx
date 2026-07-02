import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "react-bootstrap";

import { currentUserQueryKey } from "../../../entities/user/api/current-user";
import { logout } from "../api/logout";

export function LogoutButton() {
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: (response) => {
      queryClient.setQueryData(currentUserQueryKey, response);
    }
  });

  return (
    <Button
      type="button"
      variant="outline-secondary"
      size="sm"
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      Logout
    </Button>
  );
}
