import { Router } from "express";
import type { RequestHandler, Router as ExpressRouter } from "express";
import passport from "passport";

import { env } from "../../main/env.js";
import { logger } from "../../shared/logger/index.js";
import type { AuthProvider } from "./auth.service.js";
import { isAuthenticatedUser } from "./auth.types.js";
import { isAuthProviderEnabled } from "./passport.js";

const sessionCookieName = "cv.sid";

export const authRouter: ExpressRouter = Router();

function providerLabel(provider: AuthProvider): string {
  return provider === "google" ? "Google" : "GitHub";
}

function frontendUrl(path: string): string {
  return new URL(path, env.WEB_BASE_URL).toString();
}

function disabledProviderGuard(provider: AuthProvider): RequestHandler {
  return (_request, response, next) => {
    if (isAuthProviderEnabled(provider)) {
      next();
      return;
    }

    response.status(503).json({
      message: `${providerLabel(provider)} OAuth is not configured. Add provider credentials to the API environment to enable this route.`
    });
  };
}

function providerCallback(provider: AuthProvider): RequestHandler {
  return (request, response, next) => {
    passport.authenticate(provider, (error: unknown, user: Express.User | false | null) => {
      if (error) {
        logger.warn(`${providerLabel(provider)} OAuth callback failed.`, error);
        response.redirect(frontendUrl("/sign-in?auth=failed"));
        return;
      }

      if (!user) {
        response.redirect(frontendUrl("/sign-in?auth=failed"));
        return;
      }

      request.logIn(user, (loginError) => {
        if (loginError) {
          next(loginError);
          return;
        }

        response.redirect(env.WEB_BASE_URL);
      });
    })(request, response, next);
  };
}

authRouter.get(
  "/google",
  disabledProviderGuard("google"),
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

authRouter.get("/google/callback", disabledProviderGuard("google"), providerCallback("google"));

authRouter.get(
  "/github",
  disabledProviderGuard("github"),
  passport.authenticate("github", {
    scope: ["user:email"]
  })
);

authRouter.get("/github/callback", disabledProviderGuard("github"), providerCallback("github"));

authRouter.get("/me", (request, response) => {
  const currentUser = isAuthenticatedUser(request.user) ? request.user : null;

  if (!request.isAuthenticated() || !currentUser) {
    response.status(200).json({
      authenticated: false,
      user: null
    });
    return;
  }

  response.status(200).json({
    authenticated: true,
    user: currentUser
  });
});

authRouter.post("/logout", (request, response, next) => {
  request.logout((logoutError) => {
    if (logoutError) {
      next(logoutError);
      return;
    }

    request.session.destroy((sessionError) => {
      if (sessionError) {
        next(sessionError);
        return;
      }

      response.clearCookie(sessionCookieName);
      response.status(200).json({
        authenticated: false,
        user: null
      });
    });
  });
});
