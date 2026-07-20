export const routes = {
  home: "/",
  attributes: "/attributes",
  profile: "/profile",
  positions: "/positions",
  cvPreview: (positionId: string) => `/cvs/preview/${positionId}`,
  adminUsers: "/admin/users",
  signIn: "/sign-in"
} as const;
