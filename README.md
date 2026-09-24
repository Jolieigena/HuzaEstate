# HuzaEstate frontend

The Next.js app for HuzaEstate, a property marketplace for the Rwandan market. Buyers and renters browse and message owners; sellers post listings under a posting plan; professionals publish a public profile; administrators manage accounts, listings and seller subscriptions. The backend is the NestJS services in `../services`, reached through the API gateway.

## Run locally

Requirements: Node.js 20 or newer and npm, and the backend running (`docker compose up` from the repository root).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. There are no built-in demo accounts; a fresh backend starts with one administrator created from `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` (see the root `.env.example`). Sign in with it, then create professionals and administrators under Admin, Users.

```bash
npm run lint
npm test
npm run build
```

## Run with Docker

```bash
docker compose build
docker compose up
```

Open <http://localhost:8085>. The image is a multi-stage build using Next's `output: "standalone"` (see `Dockerfile`); `docker-compose.yml` maps container port 8085 (set via `PORT`) to host port 8085.

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PROPERTY_API_URL` and `NEXT_PUBLIC_PAYMENT_API_URL` are inlined into the client bundle at *build* time, so they are passed as Docker build args (defaulted in `docker-compose.yml` to the gateway at `localhost:8081`, as in `.env.example`). If the backend isn't reachable at that address from inside the container, override them before building, or point at `http://host.docker.internal:8081/...` on Docker Desktop:

```bash
docker compose --env-file .env.local build
```

Server-only secrets (`WORLD_LABS_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `GEMINI_API_KEY`) are read at container *runtime* via `docker-compose.yml`'s `environment:` block; set them in a `.env` file next to `docker-compose.yml` (or export them in the shell) before `docker compose up`.

## Project structure

```text
src/
  app/                 Routes, layouts, and API endpoints
    admin/             Administration portal (users, professionals, properties, seller payments)
    manager/           Seller portal
    professional/      Professional workspace (overview and profile)
    professionals/     Public professional directory and profiles
    properties/        Public listing search and detail
    studio/            Build and renovation workspaces (local prototype)
    execution/         Construction execution tracking (local prototype)
    api/               Tour endpoints and AI property search
  components/          Shared UI and feature-oriented components
  lib/                 Domain logic, API clients and stores
    admin/             Admin API client and hooks
    properties/        Property contract and property-service client
    favorites/         Saved homes (property-service)
    postingPlans/      Posting-plan display data and payment-service client
    storage/           Browser-storage helpers for the local prototypes
    tours/             Providers, repositories, and asset storage
public/                Static assets
```

Route files should mainly compose feature components. Business rules and state transitions belong in the corresponding `src/lib/<feature>` module. Components used by one feature belong in `src/components/<feature>`; broadly reusable UI belongs in `src/components/shared`.

## Data and persistence

Accounts, listings (including their visibility status), inquiries, saved homes, professional and landlord profiles, and posting plans are all stored by the backend services; the frontend only holds a session token.

Still local to the browser (`localStorage`): the Build and Renovate studios, construction execution tracking, the payments/invoices/contracts pages, saved searches, and 3D-tour state. Those modules start empty, have no backend, and are not shared between devices. Helpers in `src/lib/storage` provide safe access while each feature owns its keys and data shape.

The tour subsystem crosses the client/server boundary:

- API handlers in `src/app/api/tours` start and monitor generation.
- `src/lib/tours/provider` selects mock or World Labs generation.
- `src/lib/tours/assetStorage` selects local storage or Vercel Blob.
- `src/lib/tours/repository` stores the server-side tour record.
- The browser store provides fast local reads for the generating client.

Without provider credentials, tours use the mock provider. See `.env.example` for optional World Labs and Vercel Blob configuration.

## Repository conventions

- Import application modules through the `@/` alias where practical.
- Put environment-specific implementations behind a small resolver.
- When a local store's data shape changes, bump the version suffix of its storage key (for example `_v2`) so stale browser data is ignored.
- Anything that should be shared between users or devices belongs in a backend service, not `localStorage`.
