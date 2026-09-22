# JalaSpace

A property and space management demo application built with React and TypeScript.
A Node.js backend is planned for a later milestone.

> This is a portfolio/demo project. Data is stored only in the user's browser.

## Repository structure

```text
frontend/   React + TypeScript + Vite single-page application
CLAUDE.md   Development workflow and conventions (humans and AI agents)
```

## Getting started

Requirements: Node.js 24 LTS and npm.

```bash
cd frontend
npm ci
npm run dev
```

The development server runs at http://localhost:5173.

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

## Development workflow

All changes go through a feature branch and a pull request that a human reviews and approves.
See [CLAUDE.md](CLAUDE.md) for details.
