# JalaSpace

A property and space management demo application built with React and TypeScript.
A Node.js backend is planned for a later milestone.

> This is a portfolio/demo project. Data is stored only in the user's browser.

## Repository structure

```text
frontend/            React + TypeScript + Vite single-page application
.github/             CI workflows and Dependabot configuration
docker-compose.yml   Local development with Docker
CLAUDE.md            Development workflow and conventions (humans and AI agents)
```

## Getting started

### With Node.js

Requirements: Node.js 24 LTS (see `frontend/.nvmrc`) and npm.

```bash
cd frontend
npm ci
npm run dev
```

The development server runs at http://localhost:5173.

### With Docker

Requirements: Docker with Docker Compose.

```bash
docker compose up
```

The app runs at http://localhost:5173.

- The `frontend/` source is mounted into the container, so edits reload live.
- `node_modules` stays inside the container and isn't written to your machine.
- The container runs as the unprivileged `node` user.

| Task                                       | Command                         |
| ------------------------------------------ | ------------------------------- |
| Start in the background                    | `docker compose up -d`          |
| Follow logs                                | `docker compose logs -f`        |
| Stop                                       | `docker compose down`           |
| Rebuild after `package-lock.json` changes  | `docker compose up --build -V`  |
| Run a command in the container, e.g. tests | `docker compose exec frontend npm run test` |

`-V` recreates the container's `node_modules` volume, so newly installed dependencies are picked up.

## Demo sign-in

Sign in with the demo account:

| Email                | Password |
| -------------------- | -------- |
| `demo@jalaspace.app` | `demo`   |

> **This sign-in is simulated and not secure.** Credentials are checked in the browser and are
> public. The session is kept in `localStorage` (`jalaspace_session`) and exists only in your browser.

## Frontend scripts

Run these inside `frontend/`:

| Script                | Description                                         |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Start the Vite development server                   |
| `npm run lint`        | Lint with oxlint (warnings fail the check)          |
| `npm run typecheck`   | Type-check with the TypeScript compiler             |
| `npm run test`        | Run unit and component tests (Vitest)               |
| `npm run test:e2e`    | Run end-to-end tests in a browser (Playwright)      |
| `npm run test:e2e:ui` | Run end-to-end tests in Playwright's UI mode        |
| `npm run build`       | Type-check and create a production build in `dist/` |
| `npm run preview`     | Serve the production build locally                  |

## End-to-end tests

[Playwright](https://playwright.dev) tests in [`frontend/e2e/`](frontend/e2e) run the production build in Chromium, on a desktop and a mobile viewport. They cover sign-in and sign-out, navigation, direct links and the mobile navigation drawer.

Install the browser once, then run the tests:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

The tests build the app and serve it with `vite preview` on port 4173. After a run, `npx playwright show-report` opens the HTML report.

## Frontend architecture

```text
frontend/src/
├── components/    Reusable presentation components (Sidebar, Header, PageHeader, ...)
├── config/        Static configuration: navigation, data provider selection
├── layouts/       Application shell layouts
├── pages/         Route-level page components
├── hooks/         Custom React hooks
├── features/      Feature modules (auth, ...)
├── repositories/  Repository interfaces and their localStorage implementations
├── services/      Business logic (auth, lease status, dashboard statistics, demo data)
├── types/         Domain types (Property, Space, Tenant, Lease, MaintenanceTask, ...)
├── utils/         Helpers such as date handling
├── data/seed/     Demo seed data
├── styles/        Design tokens and global styles
└── router.tsx     Route definitions (React Router)
```

### Data layer

Pages never touch `localStorage` directly. They go through repository interfaces, so the storage can later be swapped for a REST API without changing the UI:

```text
React UI → custom hook → Repository interface → LocalStorageRepository (today)
                                              → ApiRepository (planned)
```

- **Data provider:** `VITE_DATA_PROVIDER` selects the implementation. `localStorage` is the default; `api` is reserved for the planned backend. See [`frontend/.env.example`](frontend/.env.example); copy it to `.env.local` to override locally.
- **Storage keys:** `jalaspace_properties`, `jalaspace_units`, `jalaspace_tenants`, `jalaspace_leases`, `jalaspace_maintenance`, `jalaspace_session` and `jalaspace_seed_version`.
- **Seed data:** on the first visit the app seeds a demo portfolio: 4 properties, 68 spaces, 31 tenants, 62 leases and 14 maintenance tasks. Dates are relative to today, so the demo always has current, upcoming and past activity. Later visits keep your changes.
- **Reset:** resetting the demo data clears all JalaSpace data except the signed-in session and restores the seed. The Settings page will expose this.
- **Data conventions:**
  - Timestamps are ISO strings (`2026-09-22T10:30:00.000Z`), and calendar dates are date-only strings (`2026-09-22`).
  - Rent is stored in euro cents.
  - A lease's status (upcoming, active or ended) is derived from its dates, not stored.

## Continuous integration

GitHub Actions runs [`ci.yml`](.github/workflows/ci.yml) on every pull request and on pushes to `main`.
Each check is a separate job:

| Job              | Command                                   |
| ---------------- | ----------------------------------------- |
| `lint`           | `npm run lint`                            |
| `typecheck`      | `npm run typecheck`                       |
| `test`           | `npm run test`                            |
| `build`          | `npm run build`                           |
| `e2e`            | `npm run test:e2e` (report kept on failure) |
| `security-audit` | `npm audit --audit-level=high`            |
| `docker-build`   | `docker build` of `frontend/Dockerfile`   |

The Node.js version is read from [`frontend/.nvmrc`](frontend/.nvmrc), so CI and local development use the same version.

Dependencies are also monitored between pull requests:

- [`dependency-check.yml`](.github/workflows/dependency-check.yml) runs `npm audit` weekly and writes an `npm outdated` report to the job summary. It can also be started manually.
- [Dependabot](.github/dependabot.yml) opens weekly update PRs for npm packages and GitHub Actions. Minor and patch updates are grouped; major updates arrive as separate PRs. These PRs go through the same CI and human review as any other change.

## Deployment

The frontend is deployed to [Vercel](https://vercel.com) at https://jalaspace.vercel.app.

| Setting           | Value           |
| ----------------- | --------------- |
| Root Directory    | `frontend`      |
| Framework Preset  | Vite            |
| Build Command     | `npm run build` |
| Output Directory  | `dist`          |
| Node.js Version   | 24.x            |
| Production Branch | `main`          |

- Every pull request gets a preview deployment for review.
- Merging to `main` deploys to production, so only reviewed code reaches production.
- [`frontend/vercel.json`](frontend/vercel.json) serves `index.html` for all application routes, so direct links and page refreshes work with client-side routing. Static files are served before the rewrite applies.

## Development workflow

All changes go through a feature branch and a pull request that a human reviews and approves.
See [CLAUDE.md](CLAUDE.md) for details.
