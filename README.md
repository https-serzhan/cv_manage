# CV Management Platform

## Overview

CV Management Platform is a monorepo application for managing reusable candidate profiles and generating position-specific CV previews.

Candidates maintain one profile with typed attribute values and projects. Recruiters configure position templates from global attributes and reusable project tags. CV previews are computed dynamically from the candidate profile and the selected position requirements. Admins manage user roles.

Generated CVs are not stored as snapshots. The preview is computed at request time from relational profile, attribute, project, position, and access data.

## Tech Stack

- TypeScript
- React
- React Router
- Express
- Prisma
- PostgreSQL
- TanStack Query
- React Bootstrap
- Docker Compose
- pnpm workspace monorepo

## Monorepo Structure

```text
cv-management-platform/
  apps/
    api/       Express API, Prisma schema, migrations, seed data
    web/       React, Vite, React Bootstrap frontend
  packages/
    shared/    Shared workspace package
```

## Prerequisites

- Node.js `>=20.0.0`
- pnpm `>=9.0.0`
- Docker and Docker Compose

## Installation

```bash
pnpm install
```

## Environment Setup

Create local environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

API variables used by the project:

```text
NODE_ENV
PORT
DATABASE_URL
API_BASE_URL
WEB_BASE_URL
SESSION_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

Web variables used by the project:

```text
VITE_API_BASE_URL
```

OAuth variables should use real provider values only in local or deployment environment files. Do not commit real secrets.

Local OAuth callback URLs:

```text
http://localhost:4000/auth/google/callback
http://localhost:4000/auth/github/callback
```

## Database Setup

Start PostgreSQL:

```bash
pnpm db:up
```

Generate Prisma Client:

```bash
pnpm prisma:generate
```

Run development migrations:

```bash
pnpm prisma:migrate
```

Equivalent explicit Prisma command:

```bash
pnpm --filter @cv-platform/api exec prisma migrate dev --schema src/prisma/schema.prisma
```

Seed system and demo data:

```bash
pnpm prisma:seed
```

The seed is repeatable. It maintains roles, required attribute categories, demo global attributes, dropdown options, reusable project tags, and representative seed-owned demo positions.

Stop PostgreSQL:

```bash
pnpm db:down
```

## Development

Run the API:

```bash
pnpm dev:api
```

Run the web app:

```bash
pnpm dev:web
```

The web app runs at `http://localhost:5173`.

Useful API checks:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/auth/me
```

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Roles

- `CANDIDATE`: manages their own profile, attribute values, projects, and can preview CVs for positions available to them.
- `RECRUITER`: manages global attributes and position templates.
- `ADMIN`: manages users and roles, can manage attributes and positions, can see all positions, and can use CV preview.

Backend role middleware remains the source of truth for protected routes.

## Core Features

- Google and GitHub OAuth authentication through Passport sessions
- Attribute Library with typed global attributes
- Candidate Profile with reusable profile details
- Dynamic typed candidate attribute values
- Candidate projects with first-use project tags
- Recruiter/admin position templates
- Public and restricted position access
- Dynamic CV preview
- CV readiness warnings for missing required attributes
- Admin user and role management
- Optimistic locking through `version` fields

## Seeded Demo Data

The seed creates these stable system records:

- Roles: `CANDIDATE`, `RECRUITER`, `ADMIN`
- Attribute categories: Personal Information, Certification, Domain Knowledge, Soft Skills, Technical Skills, Language, Education, Other

The seed also creates demo attributes:

- Phone
- LinkedIn
- GitHub
- Years of Experience
- English Level with `A1`, `A2`, `B1`, `B2`, `C1`, `C2`
- Primary Technology
- Professional Summary
- Profile Image
- Available From
- Education Period
- Open to Relocation

The seed creates reusable demo tags:

- TypeScript
- React
- Node.js
- PostgreSQL
- Python
- Data Engineering
- Java
- AWS

The seed creates demo positions:

- Senior Data Engineer, public, `maxProjects = 3`, filtered by Python and Data Engineering
- Frontend Engineer, public, filtered by React and TypeScript
- Restricted Internal Role, restricted, filtered by AWS and PostgreSQL

Demo users are not seeded because authentication is OAuth-based. Seeded fake users would not have a real login path. After the first admin is bootstrapped, sign in with Google or GitHub and use Admin Users to assign `CANDIDATE`, `RECRUITER`, or `ADMIN` roles.

Seed reruns reuse stable categories, attributes, dropdown options, and project tags. Demo positions are treated as seed-owned only when `createdById` is `null`, so recruiter-created positions with the same title are not overwritten. Candidate access rows on restricted seeded demo positions are preserved during reseed.

## First Admin Bootstrap

On a fresh database, the first OAuth login creates a user with the default `CANDIDATE` role. The Admin Users page requires an existing `ADMIN`, so one admin user must be bootstrapped through Prisma Studio in development.

1. Start PostgreSQL and the application.
2. Sign in once with Google or GitHub so the `User` record is created.
3. Open Prisma Studio:

```bash
pnpm --filter @cv-platform/api exec prisma studio --schema src/prisma/schema.prisma
```

4. Locate the created `User`.
5. Locate the `Role` row where `code` is `ADMIN`.
6. Create a `UserRole` row with that user's `userId` and the ADMIN role's `roleId`.
7. Reload the app or sign in again.
8. Use Admin Users for future role management.

## Dynamic CV Generation

CV preview is computed at request time.

- There is no CV table.
- Generated CV JSON is not persisted.
- Position attributes reference global Attribute definitions.
- Candidate values come from typed relational `CandidateAttributeValue` columns.
- Project filtering uses position project tags.
- A project matches when it has at least one selected position tag.
- If a position has no project tags, all candidate projects are eligible.
- Projects are sorted by recency: current projects first, then end date, start date, and update time.
- `maxProjects` limits the included project list when set.

## Images

Images are represented by external URLs. The database stores the URL only.

The project does not store Base64 images, BLOBs, or uploaded image files. A production deployment could add Cloudinary, S3, Azure Blob Storage, or a similar service later, while still storing only the resulting URL in PostgreSQL.

## Categories and Tags

Attribute categories are database-managed. There is no category management GUI. The Attribute Library can select existing categories only.

Project tags are created on first use by candidate projects and position project filters. Existing tags are reused with case-insensitive lookup. There is no separate tag administration screen.

## Internationalization Rule

The project includes i18n dependencies, but full UI internationalization is not implemented.

User-entered and database content is displayed as entered. Attribute names, attribute descriptions, category names, tag names, position titles, position descriptions, candidate profile text, project titles, and project descriptions are not automatically translated.

## Optimistic Locking

Mutable records use `version` fields to prevent stale updates from silently overwriting newer data. Stale writes return conflict responses, typically HTTP `409`, and the frontend displays API error messages.

## Demo Flow

Candidate:

1. Sign in with Google or GitHub.
2. Complete Candidate Profile fields.
3. Fill typed attribute values.
4. Add projects with tags such as Python, Data Engineering, React, and TypeScript.

Recruiter:

1. Open Attribute Library and review seeded attributes.
2. Create or edit position templates.
3. Select required attributes.
4. Add project tag filters.
5. Set `maxProjects` when the CV preview should limit project count.

Candidate:

1. Open Positions.
2. Select an available position.
3. Preview CV.
4. Review readiness and missing required attributes.
5. Confirm the preview includes only backend-computed matching projects.

Admin:

1. Open Admin Users.
2. Select a user.
3. Assign or remove roles.
4. Keep at least one `ADMIN` user in the system.

## Known Limitations

- CV previews are not stored as snapshots.
- There is no category management UI by design.
- Images use external URLs only.
- No built-in cloud image upload is implemented.
- Full UI internationalization is not implemented.
- Restricted position candidate access can require candidate user IDs when no candidate search UI is available.
