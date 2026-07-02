import type { AuthenticatedUser } from "./auth.service.js";

function hasStringProperty(value: object, property: string): boolean {
  return typeof (value as Record<string, unknown>)[property] === "string";
}

function hasBooleanProperty(value: object, property: string): boolean {
  return typeof (value as Record<string, unknown>)[property] === "boolean";
}

export function isAuthenticatedUser(
  user: Express.User | null | undefined
): user is AuthenticatedUser {
  if (!user || typeof user !== "object") {
    return false;
  }

  return (
    hasStringProperty(user, "id") &&
    hasStringProperty(user, "email") &&
    hasStringProperty(user, "displayName") &&
    hasBooleanProperty(user, "isBlocked")
  );
}
