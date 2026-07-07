export const routes = {
  home: "/",
  attributes: "/attributes",
  profile: "/profile",
  positions: "/positions",
  cvPreview: (positionId: string) => `/cvs/preview/${positionId}`,
  signIn: "/sign-in"
} as const;
