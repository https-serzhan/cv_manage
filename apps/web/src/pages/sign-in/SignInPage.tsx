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
      <div className="sign-in-layout">
        <div className="sign-in-copy">
          <span className="sign-in-copy__label">CV Platform</span>
          <h1>Sign in to your workspace</h1>
          <p>
            Continue with an approved social provider to manage profiles, positions, and CV
            previews.
          </p>
        </div>

        <Stack gap={3} className="sign-in-panel">
          <div>
            <h2 className="h4 mb-2">Welcome back</h2>
            <p className="text-secondary mb-0">Choose a provider to continue.</p>
          </div>

          {hasAuthFailure ? (
            <Alert variant="warning" className="mb-0">
              Sign-in failed. Check provider configuration or try again.
            </Alert>
          ) : null}

          <ProviderSignInButtons />
        </Stack>
      </div>
    </section>
  );
}
