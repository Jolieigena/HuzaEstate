# HuzaEstate

HuzaEstate is a Next.js prototype for the Rwandan property market. It combines property discovery with seller tools, AI-assisted build and renovation workspaces, professional collaboration, construction execution, finance, and platform administration.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The login page lists demo accounts for customer, seller, professional, contractor, and administrator workflows.

```bash
npm run lint
npm run build
```

## Run with Docker

```bash
docker compose build
docker compose up
```

Open <http://localhost:8085>. The image is a multi-stage build using Next's `output: "standalone"`
(see `Dockerfile`); `docker-compose.yml` maps container port 8085 (set via `PORT`) to host port 8085.

`NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_PROPERTY_API_URL` are inlined into the client bundle at *build*
time, so they're passed as Docker build args (defaulted in `docker-compose.yml` to the same
`localhost:8081` gateway as `.env.example`). If the backend isn't reachable at that address from
inside the container — e.g. it runs on the host but isn't part of this compose file — override
them before building, or point at `http://host.docker.internal:8081/...` on Docker Desktop:

```bash
docker compose --env-file .env.local build
```

Server-only secrets (`WORLD_LABS_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `GEMINI_API_KEY`) are read at
container *runtime* instead, via `docker-compose.yml`'s `environment:` block — set them in a `.env`
file next to `docker-compose.yml` (or export them in the shell) before `docker compose up`.

## Project structure

```text
src/
  app/                 Routes, layouts, and API endpoints
    admin/             Administration portal
    professional/      Professional and contractor workspace
    studio/            Build and renovation workspaces
    execution/         Construction execution tracking
    api/               Properties, finance, and tour endpoints
  components/          Shared UI and feature-oriented components
  lib/                 Domain logic, stores, fixtures, and integrations
    properties/        Property domain contracts
    storage/            Cross-feature browser-storage helpers
    tours/              Providers, repositories, and asset storage
public/                 Static assets
```

Route files should mainly compose feature components. Business rules and state transitions belong in the corresponding `src/lib/<feature>` module. Components used by one feature belong in `src/components/<feature>`; broadly reusable UI belongs in `src/components/shared`.

## Data and persistence

This repository currently behaves as a frontend prototype. Build, renovation, execution, finance, listings, and applications are seeded with demo data and persist primarily in `localStorage`. Helpers in `src/lib/storage` provide safe, consistent access while each feature continues to own its keys and data shape.

Property fixtures remain in `src/lib/data.ts`; the reusable property contract lives in `src/lib/properties/types.ts`.

The tour subsystem crosses the client/server boundary:

- API handlers in `src/app/api/tours` start and monitor generation.
- `src/lib/tours/provider` selects mock or World Labs generation.
- `src/lib/tours/assetStorage` selects local storage or Vercel Blob.
- `src/lib/tours/repository` stores the server-side tour record.
- The browser store provides fast local reads for the generating client.

Without provider credentials, tours use the mock provider. See `.env.example` for optional World Labs and Vercel Blob configuration.

## Repository conventions

- Import application modules through the `@/` alias where practical.
- Keep domain types independent from demo fixtures.
- Put environment-specific implementations behind a small resolver.
- Preserve storage keys during refactors so existing demo sessions still load.
- Put new maintenance utilities in `scripts/` and document their inputs and output there.

## Current limitations

The project has no production database or identity provider. Authentication and most persistence are local demo implementations. Production work should replace browser stores with authenticated server services and add migrations, authorization, monitoring, and automated tests for critical domain flows.
