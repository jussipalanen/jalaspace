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

## Frontend scripts

Run these inside `frontend/`:

| Script              | Description                                         |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the Vite development server                   |
| `npm run lint`      | Lint with oxlint (warnings fail the check)          |
| `npm run typecheck` | Type-check with the TypeScript compiler             |
| `npm run test`      | Run unit and component tests (Vitest)               |
| `npm run build`     | Type-check and create a production build in `dist/` |
| `npm run preview`   | Serve the production build locally                  |

## Frontend architecture

```text
frontend/src/
├── components/    Reusable presentation components (Sidebar, Header, PageHeader, ...)
├── config/        Static configuration such as navigation
├── layouts/       Application shell layouts
├── pages/         Route-level page components
├── hooks/         Custom React hooks
├── features/      Feature modules (planned)
├── repositories/  Data access abstractions (planned)
├── services/      Business logic (planned)
├── types/         Shared TypeScript types
├── utils/         Helpers (planned)
├── data/          Seed data (planned)
├── styles/        Design tokens and global styles
└── router.tsx     Route definitions (React Router)
```

## Continuous integration

GitHub Actions runs [`ci.yml`](.github/workflows/ci.yml) on every pull request and on pushes to `main`.
Each check is a separate job:

| Job              | Command                        |
| ---------------- | ------------------------------ |
| `lint`           | `npm run lint`                 |
| `typecheck`      | `npm run typecheck`            |
| `test`           | `npm run test`                 |
| `build`          | `npm run build`                |
| `security-audit` | `npm audit --audit-level=high`            |
| `docker-build`   | `docker build` of `frontend/Dockerfile`  |

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
