import passport from "passport";
import type { Profile as PassportProfile } from "passport";
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from "passport-github2";
import {
  Strategy as GoogleStrategy,
  type Profile as GoogleProfile,
  type VerifyCallback
} from "passport-google-oauth20";

import { env } from "../../main/env.js";
import { logger } from "../../shared/logger/index.js";
import type { AuthProvider } from "./auth.service.js";
import { getAuthenticatedUserById, handleProviderLogin } from "./auth.service.js";
import { isAuthenticatedUser } from "./auth.types.js";

const enabledProviders: Record<AuthProvider, boolean> = {
  google: false,
  github: false
};

let isConfigured = false;

function firstProfileValue(
  values: PassportProfile["emails"] | PassportProfile["photos"]
): string | null {
  return values?.[0]?.value ?? null;
}

function hasProviderCredentials(clientId: string, clientSecret: string): boolean {
  return Boolean(clientId.trim() && clientSecret.trim());
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error("OAuth authentication failed.");
}

export function isAuthProviderEnabled(provider: AuthProvider): boolean {
  return enabledProviders[provider];
}

export function configurePassport() {
  if (isConfigured) {
    return;
  }

  isConfigured = true;

  passport.serializeUser((user, done) => {
    if (!isAuthenticatedUser(user)) {
      done(new Error("Invalid authenticated user."));
      return;
    }

    done(null, user.id);
  });

  passport.deserializeUser(async (serializedUser, done) => {
    if (typeof serializedUser !== "string") {
      done(null, false);
      return;
    }

    try {
      const user = await getAuthenticatedUserById(serializedUser);
      done(null, user ?? false);
    } catch (error) {
      done(error);
    }
  });

  if (hasProviderCredentials(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET)) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: new URL("/auth/google/callback", env.API_BASE_URL).toString()
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: GoogleProfile,
          done: VerifyCallback
        ) => {
          try {
            const user = await handleProviderLogin({
              provider: "google",
              providerAccountId: profile.id,
              email: firstProfileValue(profile.emails),
              displayName: profile.displayName ?? profile._json.name ?? null,
              avatarUrl: firstProfileValue(profile.photos) ?? profile._json.picture ?? null
            });

            done(null, user);
          } catch (error) {
            done(toError(error));
          }
        }
      )
    );
    enabledProviders.google = true;
  } else {
    logger.warn("Google OAuth is disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.");
  }

  if (hasProviderCredentials(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET)) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          callbackURL: new URL("/auth/github/callback", env.API_BASE_URL).toString(),
          scope: ["user:email"]
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: GitHubProfile,
          done: VerifyCallback
        ) => {
          try {
            const user = await handleProviderLogin({
              provider: "github",
              providerAccountId: profile.id,
              email: firstProfileValue(profile.emails),
              displayName: profile.displayName ?? profile.username ?? null,
              avatarUrl: firstProfileValue(profile.photos)
            });

            done(null, user);
          } catch (error) {
            done(toError(error));
          }
        }
      )
    );
    enabledProviders.github = true;
  } else {
    logger.warn("GitHub OAuth is disabled: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing.");
  }
}
