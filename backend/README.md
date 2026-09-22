# JalaSpace API

The JalaSpace backend: a REST API written in TypeScript on Node.js 24 LTS with [Express 5](https://expressjs.com/).

It is at an early stage: it has a health endpoint, the properties endpoints and AI suggestions for maintenance tasks. The other domain endpoints (spaces, maintenance, tenants, leases) and the frontend's `api` data provider come next. Until then, the frontend keeps using browser localStorage.

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
| `npm run dev`       | Starts the API and restarts it when files change |
| `npm start`         | Starts the API                                 |
| `npm run lint`      | Lints with oxlint                              |
| `npm run typecheck` | Type-checks with `tsc`                         |
| `npm test`          | Runs the Vitest tests                          |

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

`npm run dev` reads `backend/.env` when it exists: copy `.env.example` to `.env` and add your key there. `npm start` reads only the real environment, as on Render.

An invalid value stops the server at start with a clear message. Never commit real secrets; production values belong in the hosting platform.

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
  | 413    | `payload_too_large` | The request body is over the limit    |
  | 429    | `rate_limited`      | Too many AI suggestions from this client (with `Retry-After`) or the AI quota is used up |
  | 500    | `internal_error`    | An unexpected error; details are only logged on the server, never sent |
  | 502    | `invalid_suggestion` | The AI answered, but not with a usable suggestion |
  | 503    | `ai_unavailable`    | No AI key is configured, or the AI provider failed or timed out |

- An error may carry extra machine-readable details next to the code, never English text. Validation errors list a code per field, the same codes the frontend already translates (`required`, `tooLong`, `invalid`):

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
| POST   | `/api/demo/reset`     | `204`; restores the demo data. Only with `SEED_DEMO_DATA=true` |
| POST   | `/api/maintenance/suggestions` | An AI suggestion for a maintenance task, see below     |

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

## Storage

Data is kept **in memory** and is lost when the server restarts. Routes use the async `Store` interface (`src/store/store.ts`), so a database can replace the in-memory store later without changing them.

### Demo data

With `SEED_DEMO_DATA=true`, the API starts with the demo data, so it is back after every restart. Docker Compose and Render enable it. The data matches the frontend seed, with the same ids (`property-joensuu-center`, …) and dates relative to today; for now it has the four demo properties, and it grows as the other endpoints are added.

Restore it at any time, undoing all changes:

```bash
curl -X POST http://localhost:3000/api/demo/reset
```

The reset endpoint exists only when `SEED_DEMO_DATA=true`, so it can never wipe non-demo data. Without the variable (as in the tests), the API starts empty.

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
├── domain/         Entity types and business rules, e.g. validation (no Express)
├── store/          The Store interface and its in-memory implementation
├── routes/         One router per area, e.g. properties.ts
└── test/           Test helpers
```

Tests start the app on a random port and call it with `fetch`, so they exercise real HTTP requests without extra libraries.
