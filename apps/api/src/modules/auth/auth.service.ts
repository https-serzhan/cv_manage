import type { Prisma } from "@prisma/client";

import { prisma } from "../../shared/db/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";

const userAuthInclude = {
  roles: {
    include: {
      role: true
    }
  },
  preference: true
} satisfies Prisma.UserInclude;

type UserWithAuthRelations = Prisma.UserGetPayload<{
  include: typeof userAuthInclude;
}>;

export type AuthProvider = "google" | "github";

export type ProviderLoginProfile = {
  provider: AuthProvider;
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isBlocked: boolean;
  roles: Array<{
    code: string;
    name: string;
  }>;
  preferences: {
    language: string;
    theme: string;
  } | null;
};

function normalizeEmail(email: string | null): string | null {
  const normalized = email?.trim().toLowerCase();

  return normalized ? normalized : null;
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function toAuthenticatedUser(user: UserWithAuthRelations): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isBlocked: user.isBlocked,
    roles: user.roles
      .map(({ role }) => ({
        code: role.code,
        name: role.name
      }))
      .sort((left, right) => left.code.localeCompare(right.code)),
    preferences: user.preference
      ? {
          language: user.preference.language,
          theme: user.preference.theme
        }
      : null
  };
}

export async function getAuthenticatedUserById(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userAuthInclude
  });

  return user ? toAuthenticatedUser(user) : null;
}

export async function handleProviderLogin(
  profile: ProviderLoginProfile
): Promise<AuthenticatedUser> {
  const providerAccountId = normalizeOptionalText(profile.providerAccountId);

  if (!providerAccountId) {
    throw new AppError(400, "OAuth provider did not return an account id.");
  }

  const email = normalizeEmail(profile.email);
  const displayName = normalizeOptionalText(profile.displayName) ?? email;
  const avatarUrl = normalizeOptionalText(profile.avatarUrl);

  return prisma.$transaction(async (tx) => {
    const existingAccount = await tx.authProviderAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId
        }
      },
      include: {
        user: {
          include: userAuthInclude
        }
      }
    });

    if (existingAccount) {
      return toAuthenticatedUser(existingAccount.user);
    }

    if (!email || !displayName) {
      throw new AppError(400, "OAuth provider did not return an email address.");
    }

    const existingUser = await tx.user.findUnique({
      where: { email },
      include: userAuthInclude
    });

    if (existingUser) {
      await tx.authProviderAccount.create({
        data: {
          userId: existingUser.id,
          provider: profile.provider,
          providerAccountId,
          email
        }
      });

      await tx.userPreference.upsert({
        where: { userId: existingUser.id },
        update: {},
        create: { userId: existingUser.id }
      });

      const refreshedUser = await tx.user.findUniqueOrThrow({
        where: { id: existingUser.id },
        include: userAuthInclude
      });

      return toAuthenticatedUser(refreshedUser);
    }

    const candidateRole = await tx.role.upsert({
      where: { code: "CANDIDATE" },
      update: { name: "Candidate" },
      create: {
        code: "CANDIDATE",
        name: "Candidate"
      }
    });

    const user = await tx.user.create({
      data: {
        email,
        displayName,
        avatarUrl,
        authProviderAccounts: {
          create: {
            provider: profile.provider,
            providerAccountId,
            email
          }
        },
        preference: {
          create: {}
        },
        roles: {
          create: {
            roleId: candidateRole.id
          }
        }
      },
      include: userAuthInclude
    });

    return toAuthenticatedUser(user);
  });
}
