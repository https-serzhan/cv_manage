# CV Management Platform

Monorepo for a CV management and recruitment platform.

## Stack

- pnpm workspaces
- React, Vite, React Router, Bootstrap, React-Bootstrap
- Express, TypeScript, Passport, Prisma, PostgreSQL
- Docker Compose for local PostgreSQL

## Structure

```text
cv-management-platform/
  apps/
    web/
    api/
  packages/
    shared/
```

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create local environment files:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. Start PostgreSQL:

   ```bash
   pnpm db:up
   ```

4. Prepare Prisma:

   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm prisma:seed
   ```

5. Start the API:

   ```bash
   pnpm dev:api
   ```

6. Start the web app:

   ```bash
   pnpm dev:web
   ```

## Authentication

The API supports Google and GitHub OAuth through Passport sessions. Local sessions use Express MemoryStore and should be replaced with a durable store before production deployment.

OAuth routes stay disabled until provider credentials are configured:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

Local callback URLs:

```text
http://localhost:4000/auth/google/callback
http://localhost:4000/auth/github/callback
```

## Verification

```bash
pnpm db:up
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm typecheck
pnpm lint
pnpm build
```

Useful local checks:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/auth/me
```

The web app runs at `http://localhost:5173`.

## Scripts

- `pnpm dev` runs the web and API development servers
- `pnpm dev:web` runs the web app
- `pnpm dev:api` runs the API
- `pnpm build` builds all workspace packages
- `pnpm lint` lints all workspace packages
- `pnpm typecheck` typechecks all workspace packages
- `pnpm db:up` starts local PostgreSQL
- `pnpm db:down` stops local PostgreSQL
- `pnpm prisma:generate` generates Prisma Client
- `pnpm prisma:migrate` runs development migrations
- `pnpm prisma:deploy` deploys migrations
- `pnpm prisma:studio` opens Prisma Studio
