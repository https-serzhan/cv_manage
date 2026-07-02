export type CurrentUserRole = {
  code: string;
  name: string;
};

export type CurrentUserPreferences = {
  language: string;
  theme: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isBlocked: boolean;
  roles: CurrentUserRole[];
  preferences: CurrentUserPreferences | null;
};

export type CurrentUserResponse =
  | {
      authenticated: true;
      user: CurrentUser;
    }
  | {
      authenticated: false;
      user: null;
    };
