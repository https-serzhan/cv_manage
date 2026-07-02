import { Alert, Stack } from "react-bootstrap";
import { Navigate, useSearchParams } from "react-router-dom";

import { useCurrentUser } from "../../entities/user/model/use-current-user";
import { ProviderSignInButtons } from "../../features/auth-by-provider/ui/ProviderSignInButtons";
import { routes } from "../../shared/routes/paths";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const currentUserQuery = useCurrentUser();
  const hasAuthFailure = searchParams.get("auth") === "failed";

  if (currentUserQuery.data?.authenticated) {
    return <Navigate to={routes.home} replace />;
  }

  return (
    <section className="sign-in-page">
      <Stack gap={3} className="sign-in-panel">
        <div>
          <h1 className="h3 mb-2">Sign in</h1>
          <p className="text-secondary mb-0">Use a connected provider to access the platform.</p>
        </div>

        {hasAuthFailure ? (
          <Alert variant="warning" className="mb-0">
            Sign-in failed. Check provider configuration or try again.
          </Alert>
        ) : null}

        <ProviderSignInButtons />
      </Stack>
    </section>
  );
}
