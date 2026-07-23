import { Button, Stack } from "react-bootstrap";

import { createApiUrl } from "../../../shared/api/client";

const providers = [
  {
    label: "Continue with Google",
    href: createApiUrl("/auth/google"),
    variant: "outline-primary"
  },
  {
    label: "Continue with GitHub",
    href: createApiUrl("/auth/github"),
    variant: "outline-dark"
  }
] as const;

export function ProviderSignInButtons() {
  return (
    <Stack gap={2}>
      {providers.map((provider) => (
        <Button
          key={provider.href}
          as="a"
          href={provider.href}
          variant={provider.variant}
          className="auth-provider-button"
        >
          {provider.label}
        </Button>
      ))}
    </Stack>
  );
}
