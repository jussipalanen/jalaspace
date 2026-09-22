# JalaSpace

A property and space management demo application built with React and TypeScript.
A Node.js backend is planned for a later milestone.

> This is a portfolio/demo project. Data is stored only in the user's browser.

## Repository structure

```text
frontend/            React + TypeScript + Vite single-page application
backend/             Node.js + TypeScript REST API (Express), see backend/README.md
.github/             CI, release workflows, Dependabot and Copilot agent profiles
CHANGELOG.md         Release notes for every version
docker-compose.yml   Local development with Docker
AGENTS.md            Development workflow and conventions for humans and AI agents
CLAUDE.md            Imports AGENTS.md for Claude Code
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

The API is a separate project in `backend/`. The demo runs without it, because the frontend stores its data in the browser; only AI maintenance suggestions need it:

```bash
cd backend
npm ci
npm run dev
```

The API runs at http://localhost:3000 (try http://localhost:3000/api/health). See [backend/README.md](backend/README.md).

To try AI maintenance suggestions locally, copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY`, and set `VITE_API_URL=http://localhost:3000` in `frontend/.env.local` (Docker Compose already sets the frontend and CORS variables). Then restart both.

### With Docker

Requirements: Docker with Docker Compose.

```bash
docker compose up
```

The app runs at http://localhost:5173, and the API at http://localhost:3000.

- The `frontend/` and `backend/` sources are mounted into their containers, so edits reload live.
- `node_modules` stays inside the container and isn't written to your machine.
- The containers run as the unprivileged `node` user.

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

Click your name in the header to edit your profile (first name, last name and birthdate) under **Settings**. Settings also has the language choice and **Reset demo data**.

> **This sign-in is simulated and not secure.** Credentials are checked in the browser and are
> public. The session is kept in `localStorage` (`jalaspace_session`) and exists only in your browser.

## Languages

JalaSpace is available in **English** and **Finnish**. Switch the language from the selector in the header, on the sign-in page or in **Settings**. The page updates immediately.

- On the first visit, the language follows the browser: Finnish for `fi*`, otherwise English.
- The choice is saved in `localStorage` (`jalaspace_language`) and kept when the demo data is reset.
- Numbers, percentages and currency follow the language (`85%` / `85 %`); dates are `d.m.yyyy` in both.
- User content, such as property names and maintenance titles, isn't translated. The demo data is in English.

Translations live in [`frontend/src/i18n/locales/`](frontend/src/i18n/locales). English (`en.ts`) defines the keys; the Finnish dictionary is type-checked against it, so a missing translation fails the build. See the Internationalization section in [AGENTS.md](AGENTS.md).

## Spaces

Open **Spaces** (`/units`) to search by space or current tenant and filter by property or status.
Filters stay in the URL and survive a reload. Use **Add space** on a property's details page
to create a space with that property already selected, or select a space to edit it.

- Names must be unique within a property (ignoring case), with at most 50 characters.
- Floors are whole numbers from −10 to 200; areas are positive, at most 100 000 m²,
  with up to two decimals. A decimal comma is accepted.
- An active lease locks the status to Occupied; otherwise choose Available or Maintenance.
- Deleting requires confirmation and is blocked while any lease or maintenance task refers to the space.
- A space with maintenance tasks cannot move to another property until those tasks are removed or reassigned.
- Saves recheck validation against current repository data. Changes persist in this browser.

Screenshots: [desktop list](docs/screenshots/spaces-desktop.png) · [mobile form](docs/screenshots/spaces-mobile.png).

## Maintenance

Open **Maintenance** (`/maintenance`) to see every task, newest first. Search titles and descriptions,
and filter by property, space, priority or status. **Due by** shows tasks due on or before a date
(type it or choose it from the calendar), and **Overdue only** shows open and in-progress tasks past
their due date. Filters stay in the URL, so they survive a reload and can be shared as links.
Changing the property clears the space filter.

- Select a task to see its details and to **Start work**, **Mark as completed** or **Reopen task**.
- Use **Add task** on the list or on a property's details page, where the property is already selected.
- A task needs a property and a title (at most 120 characters). The space is optional: leave it empty
  for the whole property or a common area; otherwise it must belong to the chosen property.
- The due date is optional. Clicking the field opens a calendar, and you can still type the date as
  `d.m.yyyy` (weeks start on Monday; Arrow Down moves into the calendar, arrow keys, Page Up/Down and
  Escape work). Past dates are allowed, and
  open tasks past their due date are marked overdue.
- Completing a task records the completion time. Editing a completed task keeps it; reopening clears it.
- **Suggest with AI** (below the description) sends the title and description to the API, which asks
  Google Gemini for a title, a description, a category and a priority. A title alone is enough. The
  description states the problem with only the facts you wrote, followed by a **To check** list of typical
  things for a maintenance worker to check, so nothing made up is recorded as fact. The suggestion is shown as a card:
  **Apply suggestion** fills in the fields, which you can still change before saving; nothing is saved
  automatically. The button is
  shown only when `VITE_API_URL` is set and the API has a Gemini key. The form tells users not to include
  personal information, because the title and description leave the browser. The first suggestion can take up
  to a minute while the free Render service wakes up.
- Task statuses do not change space statuses. Deleting a task requires confirmation.
- Saves recheck the property and space against current repository data, and the form keeps your input
  if saving fails. Dashboard and property maintenance counts follow the changes.

Screenshots: [desktop list](docs/screenshots/maintenance-desktop.png) · [mobile task details](docs/screenshots/maintenance-mobile.png).

## Tenants

Open **Tenants** (`/tenants`) to see companies and people, sorted by name, with their contact details and current spaces.
Search by name, contact person or email, and filter by type. Filters stay in the URL.

- **Add tenant** asks for the type (company or person), name, email and optional phone and notes;
  companies can also have a contact person. Emails must be unique, ignoring case.
- A tenant's page shows their current and upcoming spaces, details and past leases.
- **Assign to space** opens a new lease with the tenant already selected (see Leases).
- **Remove from space** moves the tenant out: a running lease ends yesterday and the space becomes
  Available, and a lease that has not started yet is cancelled. To schedule a later move-out,
  use **Edit lease** and set an end date.
- A tenant with leases, including past ones, cannot be deleted, so the lease history is kept.
- An occupied space's page links to its tenant (view and edit), and a property's spaces table shows each space's current tenant.

Screenshots: [desktop list](docs/screenshots/tenants-desktop.png) · [mobile tenant details](docs/screenshots/tenants-mobile.png).

## Leases

Open **Leases** (`/leases`) to see every lease with its tenant, space, period, monthly rent and status.
The status follows the dates: Upcoming, Active or Ended, counting both the start and the end day.
Filter by status and property, or search by tenant or space name. Filters stay in the URL.

- **New lease** connects a tenant to a space: choose the tenant, property and space, a start date,
  an optional end date (empty means open-ended) and an optional monthly rent. The form shows whether
  the lease will be upcoming or active today.
- **Edit lease** changes the period and rent. A future end date schedules the move-out; the tenant
  and space of a lease stay fixed, so moving a tenant means ending one lease and creating another.
- Leases of the same space cannot overlap, the end date cannot be before the start date, and a lease
  that is active today cannot start on a space in maintenance.
- A space is Occupied while it has an active lease and Available otherwise. The app updates space
  statuses when a lease is saved and every time it starts, so leases that start or end over time are
  reflected in the spaces list, occupancy and dashboard.
- Tenant pages and occupied spaces link to their leases.

Screenshots: [desktop list](docs/screenshots/leases-desktop.png) · [mobile lease form](docs/screenshots/leases-mobile.png).

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
├── i18n/          Translations (English, Finnish), language switching and locale formatting
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
- **Reset:** **Settings → Demo data → Reset demo data** (after confirmation) clears all JalaSpace data except the signed-in session and the language, restores the seed and restores the default demo profile.
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
| `backend-lint`, `backend-typecheck`, `backend-test`, `backend-security-audit` | The same checks for `backend/` |
| `backend-docker-build` | Builds `backend/Dockerfile`, starts it and calls `/api/health` |

The Node.js version is read from [`frontend/.nvmrc`](frontend/.nvmrc) and [`backend/.nvmrc`](backend/.nvmrc), so CI and local development use the same version.

Dependencies are also monitored between pull requests:

- [`dependency-check.yml`](.github/workflows/dependency-check.yml) runs `npm audit` weekly for both `frontend/` and `backend/` and writes an `npm outdated` report to the job summary. It can also be started manually.
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
| Environment       | `VITE_API_URL=https://jalaspace.onrender.com` (Production and Preview) |

- Every pull request gets a preview deployment for review.
- Merging to `main` deploys to production, so only reviewed code reaches production.
- [`frontend/vercel.json`](frontend/vercel.json) serves `index.html` for all application routes, so direct links and page refreshes work with client-side routing. Static files are served before the rewrite applies.
- The demo is kept out of search engines: every page has `<meta name="robots" content="noindex, nofollow">`, and `vercel.json` sends an `X-Robots-Tag: noindex, nofollow` header with every response. [`robots.txt`](frontend/public/robots.txt) deliberately allows crawling, because crawlers must fetch a page to see its noindex.

### Backend (API)

The API is deployed to [Render](https://render.com) as a web service at https://jalaspace.onrender.com
(health check: https://jalaspace.onrender.com/api/health).

| Setting           | Value                                      |
| ----------------- | ------------------------------------------ |
| Language          | Node                                       |
| Root Directory    | `backend/`                                 |
| Build Command     | `npm ci`                                   |
| Start Command     | `npm start` (runs the TypeScript sources directly, no build step) |
| Environment       | `NODE_ENV=production`, `NODE_VERSION=24`, `SEED_DEMO_DATA=true`, `TRUST_PROXY=1`, `CORS_ORIGINS=https://jalaspace.vercel.app,https://jalaspace-*.vercel.app`; `GEMINI_API_KEY` as a secret; Render sets `PORT` |
| Health Check Path | `/api/health`                              |
| Region            | Frankfurt (EU Central)                     |
| Branch            | `main`, auto-deploy on commit              |
| Plan              | Free                                       |

- Only changes in `backend/` trigger a deploy, and only after they are merged to `main`.
- `backend/Dockerfile` is for local development with Docker Compose; Render uses the Node runtime instead.
- The free plan sleeps after about 15 minutes without traffic, so the first request after that can take up to a minute.
- The API keeps its data in memory, so changes are lost whenever the service sleeps, restarts or is redeployed; it then starts again with the demo data (`SEED_DEMO_DATA=true`). A database comes later.
- The frontend still stores its data in the browser. It calls the API only for AI maintenance suggestions (`/api/features` and `/api/maintenance/suggestions`).

## Versions and releases

JalaSpace follows [Semantic Versioning](https://semver.org/). Every version is tagged (`v0.1.0`, `v0.1.1`, `v0.2.0` …), published as a [GitHub Release](https://github.com/jussipalanen/jalaspace/releases), and listed in [CHANGELOG.md](CHANGELOG.md).

Releases are prepared automatically by [release-please](https://github.com/googleapis/release-please) from [Conventional Commit](https://www.conventionalcommits.org/) messages:

- `feat:` → new minor version (0.1.0 → 0.2.0)
- `fix:` → patch version (0.1.0 → 0.1.1)
- `docs:`, `test:`, `ci:`, `chore:` → no release

Pull requests are **squash-merged**, so each PR title (e.g. `feat(properties): …`) becomes one changelog line.

After each merge to `main`, release-please keeps a **release PR** up to date with the next version and its CHANGELOG entry. Merging that PR creates the tag and the GitHub Release. See "Versioning and Releases" in [AGENTS.md](AGENTS.md).

## Development workflow

All changes go through a feature branch and a pull request that a human reviews and approves.
See [AGENTS.md](AGENTS.md) for details.

### GitHub Copilot agents

Two project-specific profiles live in [`.github/agents/`](.github/agents/):

| Agent | Use it for |
| ----- | ---------- |
| [JalaSpace Frontend Engineer](.github/agents/frontend-engineer.agent.md) | Implementing frontend issues using existing services, repositories, accessible English/Finnish UI, and behavior tests. |
| [JalaSpace Quality Reviewer](.github/agents/quality-reviewer.agent.md) | Reviewing a PR or branch for reproducible defects, domain consistency, accessibility, and missing tests. Returns findings without editing source. |

Both profiles explicitly read [AGENTS.md](AGENTS.md), which remains the source of shared project rules. They are selected manually, inherit the selected/default model, and do not configure additional MCP servers or secrets. The reviewer has shell access to run checks; its instruction to avoid source edits is a behavioral boundary, not a read-only sandbox.

After these files are merged into the default branch, open [Copilot agents](https://github.com/copilot/agents), select this repository, and choose a profile in the agent dropdown. Copilot cloud agent requires a paid Copilot plan and must be enabled for the repository. See GitHub's [custom agent setup](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents) and [configuration reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration).

Example tasks:

- **Frontend Engineer:** “Implement the Maintenance issue using the existing Spaces patterns. Include English/Finnish text, persistence, and tests; prepare a PR.”
- **Quality Reviewer:** “Review PR #<number> against its linked issue and main. Check domain relationships, validation, accessibility, and regression coverage. Report findings with file/line references; do not edit source.”

Use the engineer for implementation, then start a reviewer session on the resulting changes. These profiles do not automatically run on every PR or replace human approval. A human still reviews and merges changes; releases use the existing release workflow.
