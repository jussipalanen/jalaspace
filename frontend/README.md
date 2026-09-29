# JalaSpace frontend

The JalaSpace web app: a single-page application for property and space management, written in React and TypeScript with [Vite](https://vite.dev/).

By default it keeps all data in the browser (`localStorage`), so it runs without a server. With `VITE_DATA_PROVIDER=api` it reads and saves the same data through the JalaSpace API in [`../backend`](../backend/README.md).

> This is a demo with fictional data and simulated sign-in. Don't enter real personal data.

The [root README](../README.md) describes the features and the deployments; [AGENTS.md](../AGENTS.md) holds the product rules and the development workflow. This file is the developer guide for `frontend/`.

## Tech stack

| Area          | Choice                                                            |
| ------------- | ----------------------------------------------------------------- |
| UI            | React 19, function components and hooks                           |
| Language      | TypeScript (strict)                                               |
| Build         | Vite                                                              |
| Routing       | React Router (`createBrowserRouter`)                              |
| Styling       | Plain CSS with design tokens (custom properties), no CSS framework |
| Maps          | Leaflet with OpenStreetMap tiles, loaded only on pages with a map |
| Translations  | A small typed module in `src/i18n/` (English and Finnish)         |
| Lint          | oxlint                                                            |
| Tests         | Vitest, React Testing Library, jsdom; Playwright for E2E          |

Leaflet is the only runtime dependency besides React and React Router. See Dependency Rules in [AGENTS.md](../AGENTS.md#dependency-rules) before adding another.

## Getting started

Requirements: Node.js 24 LTS (see [`.nvmrc`](.nvmrc)) and npm.

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173 and sign in with the demo account:

```text
Email:     demo@jalaspace.app
Password:  demo
```

On the first visit the app seeds a demo portfolio into `localStorage`. **Settings → Demo data → Reset demo data** restores it at any time.

With Docker, `docker compose up` in the repository root starts the frontend and the API together, with `VITE_DATA_PROVIDER=api`.

## Configuration

Vite reads these variables when the dev server starts or the app is built. Copy [`.env.example`](.env.example) to `.env.local` to override them, and restart the dev server afterwards.

| Variable             | Default        | Description |
| -------------------- | -------------- | ----------- |
| `VITE_DATA_PROVIDER` | `localStorage` | Where the data is kept: `localStorage` (this browser only) or `api` (the JalaSpace API, shared by every browser). An unknown value is shown as an error where data is loaded |
| `VITE_API_URL`       | none           | Base URL of the API, e.g. `http://localhost:3000`. Required for `api`. With `localStorage` it is optional: when set, the app also offers the API's optional features (AI maintenance suggestions and Ask JalaSpace) if `GET /api/features` reports them |

| Environment               | Data provider  | API |
| ------------------------- | -------------- | --- |
| `npm run dev`             | `localStorage` | Optional |
| Docker Compose            | `api`          | The local API container |
| Vercel preview            | `localStorage` | The deployed API, for the AI features only |
| Vercel production         | `api`          | The deployed API on Render |
| Unit and E2E tests        | Fixed by the test configs, see [Testing](#testing) | |

`VITE_` variables end up in the browser bundle, so never put secrets in them. `.env.local` is git-ignored; if yours points at the deployed API, the dev server changes the public demo data.

## Scripts

| Script                  | What it does |
| ----------------------- | ------------ |
| `npm run dev`           | Starts the Vite dev server on port 5173 |
| `npm run build`         | Type-checks and builds for production into `dist/` |
| `npm run preview`       | Serves the production build (port 4173) |
| `npm run lint`          | Lints with oxlint; warnings fail the check |
| `npm run typecheck`     | Type-checks the app, the Node config files and the E2E tests (`tsc -b`) |
| `npm run test`          | Runs the unit and component tests once (Vitest) |
| `npm run test:watch`    | Runs Vitest in watch mode |
| `npm run test:e2e`      | Runs the Playwright tests with the `localStorage` provider |
| `npm run test:e2e:ui`   | Opens Playwright's UI mode |
| `npm run test:e2e:api`  | Runs the Playwright tests of the `api` provider against the real API |

CI runs lint, typecheck, test, build, both E2E suites, `npm audit` and a Docker build as separate jobs; see Continuous integration in the [root README](../README.md).

## Project structure

```text
frontend/
├── e2e/                   Playwright tests and shared fixtures
├── public/                Static files served as-is (icons, manifest, robots.txt)
├── src/
│   ├── main.tsx           Entry point: prepares demo data, then renders <App>
│   ├── App.tsx            Providers: i18n → auth → profile → router
│   ├── router.tsx         All routes; each route's `handle` names its page title
│   ├── assets/            Images imported by components
│   ├── components/        Reusable presentation components, one folder each with its CSS
│   ├── config/            Data provider, API URL and navigation configuration
│   ├── data/seed/         Demo seed data and SEED_VERSION
│   ├── features/          Feature modules: forms, tables, dialogs and data hooks per domain area
│   ├── help/              The user handbook: chapter structure and content per language
│   ├── hooks/             Shared hooks (useAsyncData, useDataLayer, useApiFeature, ...)
│   ├── i18n/              Translations, language detection and locale formatting
│   ├── layouts/           AppLayout (signed in) and PublicLayout (application form)
│   ├── pages/             Route-level components, kept thin
│   ├── repositories/      Repository interfaces with localStorage and API implementations
│   ├── services/          Business rules and data operations, without React
│   ├── styles/            Design tokens and global, form and list styles
│   ├── test/              Vitest setup and the renderRoute helper
│   ├── types/             Domain types (Property, Space, Tenant, Lease, ...)
│   └── utils/             Small helpers: dates, ids, formatting, validation
├── Dockerfile             Development image used by Docker Compose
├── playwright.config.ts       E2E tests with localStorage
├── playwright.api.config.ts   E2E tests with the API
├── vercel.json            SPA rewrite and noindex header for Vercel
└── vite.config.ts         Vite and Vitest configuration
```

## Architecture

### How a page gets its data

Pages never touch `localStorage` or `fetch`. Data flows through layers that each have one job:

```text
Page (pages/)                    layout, routing, feedback
  ↓
Feature hook (features/*/use*Data.ts)
  ↓   useAsyncData: loading, error and success states, reload
Service (services/*Service.ts)   loads and saves across repositories
  ↓   pure rules from services/<domain>.ts: validation, derived values, delete checks
Repository interface (repositories/Repository.ts)
  ↓
LocalStorageRepository           VITE_DATA_PROVIDER=localStorage
ApiRepository → REST API         VITE_DATA_PROVIDER=api
```

- **Repositories** implement one generic interface: `getAll`, `getById`, `create`, `update`, `delete`. `createDataLayer()` in [`repositories/index.ts`](src/repositories/index.ts) is the only place that maps a provider to its implementations.
- **The data layer is provided as a getter** (`useDataLayer()` returns `() => DataLayer`). Hooks call it inside their loaders, so a configuration error, such as `api` without `VITE_API_URL`, becomes an error state on the page instead of crashing the app. Tests swap in fakes with `DataLayerProvider`.
- **Services come in pairs.** `services/properties.ts` holds the pure rules (validation, summaries, delete checks) and is tested without storage; `services/propertyService.ts` uses repositories to load and save. Shared metric definitions, such as occupancy and open maintenance, live in [`services/metrics.ts`](src/services/metrics.ts) so every view counts the same way.
- **Logic returns codes, not text.** Validation returns e.g. `{ city: 'required' }`, and the component translates it.
- **Session, profile and language stay in the browser** with both providers. Only the domain entities (properties, spaces, tenants, leases, maintenance tasks, applications) move to the API.

### Storage and demo data

`localStorage` keys are namespaced with `jalaspace_` (see [`repositories/localStorage/keys.ts`](src/repositories/localStorage/keys.ts)).

At startup, [`main.tsx`](src/main.tsx):

1. starts waking the API when the data lives there (the free Render instance sleeps);
2. seeds the demo data if this browser has none, or an older `SEED_VERSION`;
3. with `localStorage`, updates space statuses for leases that started or ended since the last visit (the API does this itself).

Bump `SEED_VERSION` in [`data/seed/index.ts`](src/data/seed/index.ts) when the seed data or an entity's shape changes incompatibly. The backend keeps its own copy of the seed in `backend/src/domain/demo*.ts`; keep the two in step.

Seed dates are relative to today, so the demo always has current, upcoming and past activity. All seed data is fictional (see Business Rules in [AGENTS.md](../AGENTS.md#business-rules)).

### Routing and authentication

[`router.tsx`](src/router.tsx) defines every route. App pages sit under `RequireAuth` and `AppLayout` (sidebar and header); signed-out users go to `/login` and return to the page they asked for. `/apply` and `/apply/:spaceId` are public and use `PublicLayout`.

Each route's `handle.titleKey` sets the document title in the active language.

Sign-in is simulated in the browser ([`services/authService.ts`](src/services/authService.ts)). It is not secure authentication and must never be presented as such.

### Translations

The UI is available in English and Finnish. No UI text is hard-coded in components.

```tsx
const { t, locale } = useTranslation()

t('dashboard.stats.spacesOccupied', { occupied: 58, total: 68 })
```

- [`i18n/locales/en.ts`](src/i18n/locales/en.ts) is the source of truth for keys; [`fi.ts`](src/i18n/locales/fi.ts) is typed against it, so a missing Finnish key is a type error.
- Placeholders are `{name}`; numbers in them are formatted for the locale. Plurals are `{ one, other }` objects chosen with `Intl.PluralRules` by `values.count`.
- Format numbers, money (stored in cents) and areas with [`i18n/format.ts`](src/i18n/format.ts), and sort user-visible text with `localeCompare(…, locale)`. Dates are shown as `d.m.yyyy` in both languages.
- User content (names, addresses, descriptions) is shown as entered and never translated.

When you add UI text, add both translations in the same pull request.

### Styling

Plain CSS, no framework:

- [`styles/tokens.css`](src/styles/tokens.css) defines colours, spacing, radii and typography as custom properties; use the tokens instead of literal values. Chart colours are the `--color-chart-*` tokens.
- [`styles/global.css`](src/styles/global.css), `forms.css` and `lists.css` hold shared primitives such as cards, buttons, form fields and tables. `main.tsx` imports them first so component styles can override them.
- Each component or page imports its own CSS file next to it, with BEM-like class names (`settings-section__header`).

### Optional API features

AI maintenance suggestions and Ask JalaSpace need the API. `useApiFeature()` asks `GET /api/features` once per page load and offers the feature only when `VITE_API_URL` is set and the API reports it. The app works fully without them.

Maps are loaded lazily through `LazyLocationMap`, so Leaflet is downloaded only on pages that show a map. The address search calls OpenStreetMap Nominatim from the browser, only when the user presses Search.

## Testing

### Unit and component tests

Vitest runs `src/**/*.test.{ts,tsx}` in jsdom. Tests sit next to the code they test.

- [`vite.config.ts`](vite.config.ts) fixes `VITE_DATA_PROVIDER=localStorage` and an empty `VITE_API_URL`, so `.env.local` can never make tests read or change real data. Tests that need other values use `vi.stubEnv`.
- [`test/setup.ts`](src/test/setup.ts) replaces `fetch` with one that fails, clears `localStorage` after each test, and adds the `<dialog>` methods jsdom lacks. A test that needs the API stubs `fetch` itself.
- [`test/renderRoute.tsx`](src/test/renderRoute.tsx) renders a route with all providers, signed in by default, and can take a fake data layer or a language:

  ```tsx
  renderRoute('/properties')
  renderRoute('/settings', { language: 'fi' })
  renderRoute('/', { authenticated: false })
  ```

- Tests render in English unless they choose a language. Query by role, label or text, as users do.

Business rules, validation and repositories get the most tests; see Testing in [AGENTS.md](../AGENTS.md#testing).

### End-to-end tests

Playwright runs the **production build** served by `vite preview`, the closest local match to Vercel. Install the browser once:

```bash
npx playwright install chromium
```

| Suite | Files | Config | Runs against |
| ----- | ----- | ------ | ------------ |
| Desktop | `e2e/*.spec.ts` | [`playwright.config.ts`](playwright.config.ts) | A `localStorage` build on port 4173 |
| Mobile (Pixel 7) | `e2e/*.mobile.spec.ts` | [`playwright.config.ts`](playwright.config.ts) | The same build |
| API | `e2e/*.api.spec.ts` | [`playwright.api.config.ts`](playwright.api.config.ts) | An `api` build on port 4174 and the real API from `../backend` on port 3100 |

- The API suite needs `npm ci` in `backend/` first. The API holds one shared dataset, so these tests run one at a time and reset it before each test.
- No test reaches external services: OpenStreetMap is blocked in the browser, and tests that need the API features or map answer with `page.route`. The AI provider is never called.
- Each test starts with fresh browser storage. Tests that don't test sign-in start signed in through `signedInState()` in [`e2e/fixtures.ts`](e2e/fixtures.ts).
- Use accessible locators (`getByRole`, `getByLabel`) and auto-waiting assertions; never fixed waits.
- Reports: `npx playwright show-report`, or `npx playwright show-report playwright-report-api` for the API suite.

Cover critical user flows here and leave edge cases to the unit tests.

## Common tasks

**Add a page.** Create the component in `pages/`, add its route and a `pages.<name>.title` key to [`router.tsx`](src/router.tsx), add the title in both locale files, and add a navigation item to [`config/navigation.ts`](src/config/navigation.ts) if it belongs in the sidebar. Put forms, tables and data hooks in the matching `features/` folder and the rules in `services/`.

**Add a field to an entity.** Update the type in `types/`, the rules in `services/<domain>.ts`, the form and its translations, the seed data, and the backend's validation in the same pull request. If older stored data or an older API lacks the field, give it a default where it is read (see `withSpaceDefaults` in [`repositories/index.ts`](src/repositories/index.ts)) or bump `SEED_VERSION`.

**Add a delete.** Check with current data at the moment of deleting whether other records still refer to the entity, and block the delete with an explanation if they do. See Deleting related data in [AGENTS.md](../AGENTS.md#deleting-related-data).

**Update the handbook.** When a change affects how the app is used, update the chapter in [`help/content/en.ts`](src/help/content/en.ts) and [`fi.ts`](src/help/content/fi.ts) in the same pull request, with button and field names in `**bold**` exactly as the UI shows them. New chapters and sections go into [`help/structure.ts`](src/help/structure.ts) first; the type checker then asks for them in both languages. Give a new route a `help` target in its `handle` so the header's **?** button opens the right chapter.

**Generate an id.** Use `generateId()` from [`utils/id.ts`](src/utils/id.ts), never `crypto.randomUUID()` directly: it is missing when the dev server is opened over plain HTTP on a network address, e.g. from a phone.

## Before opening a pull request

Run in `frontend/`:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Also run `npm run test:e2e:api` when you changed the data layer or anything the API serves. The pull request title must be a Conventional Commit; see [Versioning and Releases](../AGENTS.md#versioning-and-releases).

## Deployment

The app is deployed to Vercel with `frontend` as the root directory: `npm run build`, output `dist`. [`vercel.json`](vercel.json) serves `index.html` for every route, so direct links and reloads work, and sends `X-Robots-Tag: noindex, nofollow` to keep the demo out of search engines. Pull requests get preview deployments; merging to `main` deploys to production. See Deployment in the [root README](../README.md).
