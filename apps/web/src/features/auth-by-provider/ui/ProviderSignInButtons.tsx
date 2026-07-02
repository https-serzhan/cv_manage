import { Button, Stack } from "react-bootstrap";

import { apiBaseUrl } from "../../../shared/api/client";

const providers = [
  {
    label: "Continue with Google",
    href: `${apiBaseUrl}/auth/google`,
    variant: "outline-primary"
  },
  {
    label: "Continue with GitHub",
    href: `${apiBaseUrl}/auth/github`,
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
