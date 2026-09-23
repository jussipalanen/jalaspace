# JalaSpace API

The JalaSpace backend: a REST API written in TypeScript on Node.js 24 LTS with [Express 5](https://expressjs.com/).

It is at an early stage: it has a health endpoint, endpoints for all domain entities (properties, spaces, maintenance tasks, tenants and leases) and AI suggestions for maintenance tasks. The frontend uses them with `VITE_DATA_PROVIDER=api`, e.g. in Docker Compose. Until then, the frontend keeps using browser localStorage.

## Running

Requirements: Node.js 24 LTS (see `.nvmrc`) and npm.

The Node.js major version is set in three places that must change together: `.nvmrc`, `@types/node` in `package.json`, and `NODE_VERSION` on Render. Dependabot therefore skips major `@types/node` updates.

```bash
cd backend
npm ci
npm run dev
```

The API listens on http://localhost:3000. Check it with:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","version":"0.6.0"}
```

With Docker, `docker compose up` in the repository root starts the API next to the frontend.

The deployed API runs on Render: https://jalaspace.onrender.com/api/health. See Deployment in the [root README](../README.md#backend-api).

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Starts the API and restarts it when a file in `src/` changes |
| `npm start`         | Starts the API                                 |
| `npm run lint`      | Lints with oxlint                              |
| `npm run typecheck` | Type-checks with `tsc`                         |
| `npm test`          | Runs the Vitest tests                          |

`npm run dev` watches the whole `src/` directory (`--watch-path=src`), not only the files the server has loaded. So the API picks up every file after a branch switch or `git pull`, and restarts by itself after a failed start once the problem is fixed; with plain `--watch` it could keep running a mix of old and new code. Saving a test file under `src/` also restarts it.

### No build step

Node.js 24 runs the TypeScript sources directly by stripping the type annotations. `tsc` only type-checks. So:

- imports use the `.ts` extension, e.g. `import { createApp } from './app.ts'`;
- only erasable TypeScript syntax is allowed (no `enum`, `namespace` or constructor parameter properties). `tsc` enforces this with `erasableSyntaxOnly`.

## Configuration

Environment variables (see [`.env.example`](.env.example)):

| Variable | Default   | Description                         |
| -------- | --------- | ----------------------------------- |
| `PORT`   | `3000`    | Port to listen on (1–65535)         |
| `HOST`   | `0.0.0.0` | Network interface to listen on      |
| `SEED_DEMO_DATA` | `false` | `true` starts the API with the demo data and enables `POST /api/demo/reset` |
| `GEMINI_API_KEY` | none | Gemini API key for AI maintenance suggestions. A secret. Without it the feature is off |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Gemini model for the suggestions |
| `CORS_ORIGINS` | none | Origins allowed to call the API from a browser, comma-separated. `*` matches part of one host label, e.g. `https://jalaspace-*-team.vercel.app` |
| `TRUST_PROXY` | `0` | Number of proxies in front of the API (Render: `1`), so the client IP used for rate limits is read from `X-Forwarded-For` |
| `WRITE_RATE_LIMIT` | `60` | Writes (`POST`, `PUT`, `DELETE`) allowed per client and minute, see [Limits](#limits) |
| `RESET_RATE_LIMIT` | `10` | Demo resets allowed per client and hour |
| `DEMO_RESET_AT` | `03:00` | With `SEED_DEMO_DATA=true`: UTC time of the nightly demo reset (`HH:MM`), or `off` |

`npm run dev` reads `backend/.env` when it exists: copy `.env.example` to `.env` and add your key there. `npm start` reads only the real environment, as on Render.

An invalid value stops the server at start with a clear message. Never commit real secrets; production values belong in the hosting platform.

## API documentation

Interactive docs: **http://localhost:3000/docs** (deployed: https://jalaspace.onrender.com/docs). The server root `/` redirects there.

- `GET /docs` shows [Swagger UI](https://swagger.io/tools/swagger-ui/): every endpoint with its fields, rules, examples and error codes, and **Try it out** to send requests to this server. On the deployed API these requests change the shared demo data, like the app does.
- `GET /docs/openapi.json` is the [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) description, e.g. for Postman or client generators.

The description is **generated from the running API** (`src/openapi/`):

- paths and methods are read from the routes Express actually has, so the docs list exactly what this server offers (`POST /api/demo/reset` only with `SEED_DEMO_DATA=true`);
- schemas are built from the same constants the validation uses (allowed values, lengths, ranges, patterns);
- only summaries, descriptions and examples are written by hand, in `src/openapi/document.ts`.

Tests fail when a route has no documentation, an error code is not shown, a schema reference is broken, or a request example is rejected by the API's own validation. So **when you add a route, document it in `OPERATIONS`**.

Swagger UI loads from jsDelivr, pinned to one version with Subresource Integrity hashes, and the page has a strict Content Security Policy (no inline scripts). To update it, change the version in `src/routes/docs.ts` and recompute both hashes as described there.

## API conventions

- All routes live under `/api` and send and receive JSON. Request bodies are limited to 100 kB.
- Errors return a code, not an English message, so the frontend can show them in the user's language:

  ```json
  { "error": { "code": "not_found" } }
  ```

  | Status | Code                | When                                  |
  | ------ | ------------------- | ------------------------------------- |
  | 400    | `invalid_json`      | The request body is not valid JSON    |
  | 400    | `validation_failed` | The body has invalid fields, listed in `fields` |
  | 404    | `not_found`         | The route or resource does not exist  |
  | 409    | `property_in_use`   | The property still has spaces or maintenance tasks |
  | 409    | `space_in_use`      | The space still has leases or maintenance tasks |
  | 409    | `tenant_in_use`     | The tenant still has leases |
  | 409    | `limit_reached`     | The collection is full, so nothing more can be created (with `limit`) |
  | 413    | `payload_too_large` | The request body is over the limit    |
  | 429    | `rate_limited`      | Too many writes, demo resets or AI suggestions from this client (with `Retry-After`), or the AI quota is used up |
  | 500    | `internal_error`    | An unexpected error; details are only logged on the server, never sent |
  | 502    | `invalid_suggestion` | The AI answered, but not with a usable suggestion |
  | 503    | `ai_unavailable`    | No AI key is configured, or the AI provider failed or timed out |

- An error may carry extra machine-readable details next to the code, never English text. Validation errors list a code per field, the same codes the frontend already translates (`required`, `tooLong`, `invalid`, `beforeStart`, and for rules that compare with the stored data `notFound`, `duplicate`, `maintenanceLinked`, `overlap` and `maintenance`):

  ```json
  { "error": { "code": "validation_failed", "fields": { "name": "required", "postalCode": "invalid" } } }
  ```

- Route handlers throw `ApiError(status, code, details?)` for expected errors; the shared error handler turns them into responses.
- The server assigns `id` (a UUID), `createdAt` and `updatedAt`. Clients send only the editable fields; other fields are ignored. Text fields are trimmed.
- The server stops gracefully on `SIGTERM` and `SIGINT`, letting open requests finish.

## Endpoints

| Method | Path                  | Response                                                       |
| ------ | --------------------- | -------------------------------------------------------------- |
| GET    | `/api/health`         | `{ "status": "ok", "version": "x.y.z" }`                       |
| GET    | `/api/features`       | `{ "maintenanceSuggestions": true }`: optional features this API offers |
| GET    | `/api/properties`     | All properties                                                 |
| GET    | `/api/properties/:id` | One property, or `404 not_found`                               |
| POST   | `/api/properties`     | `201` with the created property and a `Location` header        |
| PUT    | `/api/properties/:id` | The updated property, or `404 not_found`                       |
| DELETE | `/api/properties/:id` | `204`, `404 not_found`, or `409 property_in_use` with counts   |
| GET    | `/api/units`          | All spaces                                                     |
| GET    | `/api/units/:id`      | One space, or `404 not_found`                                  |
| POST   | `/api/units`          | `201` with the created space and a `Location` header           |
| PUT    | `/api/units/:id`      | The updated space, or `404 not_found`                          |
| DELETE | `/api/units/:id`      | `204`, `404 not_found`, or `409 space_in_use` with counts      |
| GET    | `/api/maintenance`    | All maintenance tasks                                          |
| GET    | `/api/maintenance/:id` | One task, or `404 not_found`                                  |
| POST   | `/api/maintenance`    | `201` with the created task and a `Location` header            |
| PUT    | `/api/maintenance/:id` | The updated task, or `404 not_found`                          |
| DELETE | `/api/maintenance/:id` | `204`, or `404 not_found`                                     |
| GET    | `/api/tenants`        | All tenants                                                    |
| GET    | `/api/tenants/:id`    | One tenant, or `404 not_found`                                 |
| POST   | `/api/tenants`        | `201` with the created tenant and a `Location` header          |
| PUT    | `/api/tenants/:id`    | The updated tenant, or `404 not_found`                         |
| DELETE | `/api/tenants/:id`    | `204`, `404 not_found`, or `409 tenant_in_use` with the lease count |
| GET    | `/api/leases`         | All leases                                                     |
| GET    | `/api/leases/:id`     | One lease, or `404 not_found`                                  |
| POST   | `/api/leases`         | `201` with the created lease and a `Location` header           |
| PUT    | `/api/leases/:id`     | The updated lease, or `404 not_found`                          |
| DELETE | `/api/leases/:id`     | `204`, or `404 not_found`                                      |
| POST   | `/api/demo/reset`     | `204`; restores the demo data. Only with `SEED_DEMO_DATA=true` |
| POST   | `/api/maintenance/suggestions` | An AI suggestion for a maintenance task, see below     |
| GET    | `/docs`               | Interactive API documentation (Swagger UI); `/` redirects here |
| GET    | `/docs/openapi.json`  | The OpenAPI 3.1 description                                    |

The health version comes from `package.json`, which release-please keeps in step with the app version.

### Properties

Editable fields and rules (the same as in the app):

| Field         | Rules                                                          |
| ------------- | -------------------------------------------------------------- |
| `name`        | Required, at most 100 characters                               |
| `type`        | Required: `office`, `retail`, `industrial`, `residential` or `mixed_use` |
| `address`     | Required                                                       |
| `postalCode`  | Required, 5 digits                                             |
| `city`        | Required                                                       |
| `description` | Optional, at most 1000 characters                              |

```bash
curl -X POST http://localhost:3000/api/properties \
  -H 'content-type: application/json' \
  -d '{"name":"Joensuu Center","type":"mixed_use","address":"Siltakatu 12","postalCode":"80100","city":"Joensuu"}'
```

A property that still has spaces or maintenance tasks cannot be deleted, so no data is left pointing to it:

```json
{ "error": { "code": "property_in_use", "spaceCount": 2, "maintenanceCount": 1 } }
```

### Spaces

Spaces are served under `/api/units`, like the app route; the entity is called a space. Editable fields and rules (the same as in the app):

| Field        | Rules                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `propertyId` | Required; the property must exist (`notFound`)                           |
| `name`       | Required, at most 50 characters, unique within the property ignoring case (`duplicate`) |
| `type`       | Required: `office`, `retail`, `industrial`, `storage` or `apartment`     |
| `floor`      | Required, a whole number from −10 to 200                                 |
| `areaM2`     | Required, a number over 0 and at most 100 000 with at most two decimals  |
| `status`     | Required: `available`, `occupied` or `maintenance`, see below            |

```bash
curl -X POST http://localhost:3000/api/units \
  -H 'content-type: application/json' \
  -d '{"propertyId":"property-joensuu-center","name":"A 501","type":"office","floor":5,"areaM2":62.5,"status":"available"}'
```

- **Status follows the leases:** a space is occupied exactly when it has an active lease (see Leases). A new space has no leases, so `occupied` is saved as `available`; a space with an active lease stays occupied whatever the client sends, and one without cannot be made occupied. Clients choose between `available` and `maintenance`.
- Leases start and end as days pass, so the stored statuses are brought up to date whenever spaces are read.
- A space with maintenance tasks cannot move to another property (`propertyId`: `maintenanceLinked`), because the tasks refer to both.
- A space that still has leases or maintenance tasks cannot be deleted:

  ```json
  { "error": { "code": "space_in_use", "leaseCount": 1, "maintenanceCount": 2 } }
  ```

### Maintenance tasks

Editable fields and rules (the same as in the app):

| Field         | Rules                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| `propertyId`  | Required; the property must exist (`notFound`)                         |
| `spaceId`     | Optional; `null` for the whole property or a common area. A given space must belong to the property (`invalid`) |
| `title`       | Required, at most 120 characters                                       |
| `description` | Optional, at most 5000 characters                                      |
| `category`    | Required: `plumbing`, `electrical`, `hvac`, `structural`, `cleaning` or `general` |
| `priority`    | Required: `low`, `medium` or `high`                                    |
| `status`      | Required: `open`, `in_progress` or `completed`                         |
| `dueDate`     | Optional, a date-only ISO string such as `2026-09-30`; past dates are allowed |

```bash
curl -X POST http://localhost:3000/api/maintenance \
  -H 'content-type: application/json' \
  -d '{"propertyId":"property-joensuu-center","spaceId":null,"title":"Main door closer broken","category":"general","priority":"high","status":"open","dueDate":"2026-09-30"}'
```

- **Status changes are updates:** send the task with the new `status` in a `PUT`. The server sets `completedAt` when a task is completed, keeps it while the task stays completed, and clears it when the task is reopened. Clients cannot set it.
- Nothing refers to a task, so it can always be deleted. A property or space with tasks cannot be deleted, and a space with tasks cannot move to another property.

### Tenants

Editable fields and rules (the same as in the app):

| Field           | Rules                                                                 |
| --------------- | --------------------------------------------------------------------- |
| `type`          | Required: `company` or `person`                                       |
| `name`          | Required, at most 100 characters                                      |
| `contactPerson` | Optional, at most 100 characters. Only companies have one; for a person it is ignored and saved as `null` |
| `email`         | Required, a valid address of at most 254 characters, unique ignoring case (`duplicate`) |
| `phone`         | Optional (`null` when empty): 5–20 characters of digits, spaces, `+`, `-` and parentheses |
| `notes`         | Optional, at most 2000 characters                                     |

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H 'content-type: application/json' \
  -d '{"type":"company","name":"Lakeside Bakery Oy","contactPerson":"Maija Salo","email":"info@lakeside-bakery.example"}'
```

A tenant that still has leases (current, upcoming or past) cannot be deleted:

```json
{ "error": { "code": "tenant_in_use", "leaseCount": 2 } }
```

Assigning a tenant to a space and removing them from one are lease operations, see below.

### Leases

Fields and rules (the same as in the app):

| Field              | Rules                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `tenantId`         | Required; the tenant must exist (`notFound`). Fixed once the lease exists |
| `spaceId`          | Required; the space must exist (`notFound`). Fixed once the lease exists; see the period rules below |
| `startDate`        | Required, a date-only ISO string such as `2026-10-01`              |
| `endDate`          | Optional (`null` for an open-ended lease), not before the start (`beforeStart`) |
| `monthlyRentCents` | Optional (`null`), a whole number of euro cents over 0 and at most 100 000 000 (1 000 000 €) |

```bash
curl -X POST http://localhost:3000/api/leases \
  -H 'content-type: application/json' \
  -d '{"tenantId":"tenant-aurora-yoga","spaceId":"space-kuopio-harbour-10","startDate":"2026-10-01","endDate":null,"monthlyRentCents":125050}'
```

- **Status is derived, not stored:** `upcoming` before the start date, `ended` after the end date, otherwise `active`. Both dates count as days of the lease, and "today" is the server's UTC date.
- **One lease at a time per space:** the period must not overlap another lease of the same space (`spaceId`: `overlap`).
- A lease that is active today cannot start on a space in maintenance (`spaceId`: `maintenance`). An upcoming lease can.
- **Space status follows:** after a lease is created, updated or deleted, its space is occupied exactly when it has an active lease. An upcoming lease does not occupy it.
- An update changes only the period and the rent; the stored tenant and space are kept, whatever the client sends.
- **Removing a tenant from a space**, as in the app: end a running lease yesterday with a `PUT`, or `DELETE` a lease that has not started to cancel it. Nothing refers to a lease, so it can always be deleted.

### Maintenance suggestions

`POST /api/maintenance/suggestions` suggests a title, a description, a category and a priority from the user's title, description or both. The description first states the problem with only the facts from the user's text (no added causes, places, times or other details, and no names or contact details), then a `To check:` list (`Tarkistettavaa:` in Finnish) of typical things for a maintenance worker to check, written as checks, not findings. Nothing is stored; the user reviews the suggestion in the app and decides whether to use it.

```bash
curl -X POST http://localhost:3000/api/maintenance/suggestions \
  -H 'content-type: application/json' \
  -d '{"title":"kitchen sink leak","language":"en"}'
# {"title":"Kitchen sink leak","description":"Water is leaking at the kitchen sink.\n\nTo check:\n- the drain trap and connections under the sink\n- the supply hoses and shut-off valves","category":"plumbing","priority":"high"}
```

| Field         | Rules                                                     |
| ------------- | --------------------------------------------------------- |
| `title`       | At most 120 characters                                    |
| `description` | At most 2000 characters; a title or a description is required |
| `language`    | `en` (default) or `fi`: the language of the suggested title and description |

- The suggestion comes from the [Gemini API](https://ai.google.dev/gemini-api/docs) free tier, called with plain `fetch` and asked for JSON that follows a schema. With billing off, the free tier cannot cost money; when its quota runs out, requests answer `429 rate_limited`.
- The answer is never trusted: it is checked against the app's categories (`plumbing`, `electrical`, `hvac`, `structural`, `cleaning`, `general`), priorities (`low`, `medium`, `high`), title length (120) and description length (5000), and an unusable answer becomes `502 invalid_suggestion`.
- The instructions tell the model to treat the title and description as data, not instructions. Gemini gives up after 20 seconds.
- Each client can ask for 10 suggestions per 10 minutes (`429 rate_limited` with `Retry-After`). The limit is kept in memory per client IP; set `TRUST_PROXY` behind a proxy, or every visitor shares the proxy's limit.
- Failures are logged without the title and description.
- The provider is behind the `MaintenanceSuggester` interface (`src/ai/suggestions.ts`), so another provider can be added without changing the route. Tests use fakes and never call Gemini.

Get a key at [Google AI Studio](https://aistudio.google.com/apikey). On Render, set it as a secret environment variable.

## Limits

The API is public and keeps its data in memory, so it limits how fast one client can change data and how much can be stored:

| Limit | Default | Answer when exceeded |
| --- | --- | --- |
| Writes (`POST`, `PUT`, `DELETE`) per client | 60 per minute (`WRITE_RATE_LIMIT`) | `429 rate_limited` with `Retry-After` |
| Demo resets per client, on top of the write limit | 10 per hour (`RESET_RATE_LIMIT`) | `429 rate_limited` with `Retry-After` |
| AI suggestions per client | 10 per 10 minutes | `429 rate_limited` with `Retry-After` |
| Stored records | properties 50, spaces 500, maintenance tasks 500, tenants 300, leases 1000 | `409 limit_reached` with the limit |

- Reads are not limited. AI suggestions count only against their own limit.
- A full collection can still be updated and cleaned up: only creating is refused.
- Clients are told apart by IP address, so set `TRUST_PROXY` behind a proxy. Otherwise every visitor shares the proxy's limits.
- The counts are kept in memory and reset when the server restarts. The record limits (`src/limits.ts`) are far above the demo data.

## Storage

Data is kept **in memory** and is lost when the server restarts. Routes use the async `Store` interface (`src/store/store.ts`), so a database can replace the in-memory store later without changing them.

### Demo data

With `SEED_DEMO_DATA=true`, the API starts with the demo data, so it is back after every restart. Docker Compose and Render enable it. The data matches the frontend seed, with the same ids (`property-joensuu-center`, `space-joensuu-center-1`, …) and dates relative to today; it has the 4 demo properties, their 68 spaces, 14 maintenance tasks, 31 tenants and 62 leases, and follows the same rules as data entered through the API: every occupied space has an active lease. Demo properties have spaces and demo tenants have leases, so they cannot be deleted. Date-only values such as due dates use the server's UTC calendar day.

Restore it at any time, undoing all changes:

```bash
curl -X POST http://localhost:3000/api/demo/reset
```

The reset endpoint exists only when `SEED_DEMO_DATA=true`, so it can never wipe non-demo data. Without the variable (as in the tests), the API starts empty.

The API also restores the demo data **every night at `DEMO_RESET_AT`** (default 03:00 UTC). A server that never sleeps or restarts, e.g. when an uptime monitor keeps the free Render plan awake, would otherwise keep whatever visitors changed. Each reset is logged; a failed one is logged and the next one still runs.

## Structure

```text
src/
├── app.ts          Creates the Express app (routes, JSON parsing, error handling)
├── server.ts       Starts the HTTP server and handles shutdown
├── config.ts       Reads and validates environment variables
├── errors.ts       ApiError, error codes, 404 and error handlers
├── cors.ts         Allows the configured origins to call the API from a browser
├── version.ts      App version from package.json
├── ai/             AI maintenance suggestions: provider interface, Gemini, rate limit
├── openapi/        Generates the OpenAPI description from the routes and domain rules
├── domain/         Entity types and business rules, e.g. validation (no Express)
├── store/          The Store interface and its in-memory implementation
├── routes/         One router per area, e.g. properties.ts
└── test/           Test helpers
```

Tests start the app on a random port and call it with `fetch`, so they exercise real HTTP requests without extra libraries.
