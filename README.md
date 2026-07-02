# CV Management Platform

Starter monorepo for a CV management and recruitment platform.

## Stack

- pnpm workspaces
- React, Vite, React Router, Bootstrap, React-Bootstrap
- Express, TypeScript, Prisma, PostgreSQL
- Docker Compose for local PostgreSQL

## Project Structure

```text
cv-management-platform/
  apps/
    web/
    api/
  packages/
    shared/
```

## Setup

1. Install pnpm if needed:

   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Make sure Docker is installed and available on your PATH, then start local PostgreSQL:

   ```bash
   pnpm db:up
   ```

4. Create environment files:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

5. Generate Prisma Client:

   ```bash
   pnpm prisma:generate
   ```

6. Run the initial Prisma migration when the database is running:

   ```bash
   pnpm prisma:migrate
   ```

7. Start the backend:

   ```bash
   pnpm dev:api
   ```

8. Start the frontend in another terminal:

   ```bash
   pnpm dev:web
   ```

## Verification

- Frontend: open `http://localhost:5173` and confirm the page shows `CV Management Platform` and `Hello, world.`
- Backend: open `http://localhost:4000/health` or run:

  ```bash
  curl http://localhost:4000/health
  ```

- PostgreSQL: run:

  ```bash
  docker compose ps
  ```

  The `postgres` service should be running and healthy.

- Prisma: run:

  ```bash
  pnpm prisma:generate
  pnpm prisma:migrate
  ```

  The current schema contains only a temporary `SetupCheck` model for confirming the Prisma setup.

## Scripts

- `pnpm dev` - run web and API development servers
- `pnpm dev:web` - run only the web app
- `pnpm dev:api` - run only the API
- `pnpm build` - build all workspace packages
- `pnpm lint` - lint all workspace packages
- `pnpm typecheck` - typecheck all workspace packages
- `pnpm db:up` - start local PostgreSQL
- `pnpm db:down` - stop local PostgreSQL
- `pnpm prisma:generate` - generate Prisma Client
- `pnpm prisma:migrate` - run a development migration
- `pnpm prisma:deploy` - deploy migrations
- `pnpm prisma:studio` - open Prisma Studio

## Notes

- Authentication and business features are intentionally not implemented yet.
- The full domain database model is intentionally not created yet.
- The shared package contains only basic placeholder types and does not expose database models.
