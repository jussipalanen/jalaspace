# JalaSpace API

The JalaSpace backend: a REST API written in TypeScript on Node.js 24 LTS with [Express 5](https://expressjs.com/).

It is at an early stage: it has a health endpoint and the properties endpoints. The other domain endpoints (spaces, maintenance, tenants, leases) and the frontend's `api` data provider come next. Until then, the frontend keeps using browser localStorage.

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
  | 500    | `internal_error`    | An unexpected error; details are only logged on the server, never sent |

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
| GET    | `/api/properties`     | All properties                                                 |
| GET    | `/api/properties/:id` | One property, or `404 not_found`                               |
| POST   | `/api/properties`     | `201` with the created property and a `Location` header        |
| PUT    | `/api/properties/:id` | The updated property, or `404 not_found`                       |
| DELETE | `/api/properties/:id` | `204`, `404 not_found`, or `409 property_in_use` with counts   |

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

## Storage

Data is kept **in memory** and starts empty; it is lost when the server restarts. Routes use the async `Store` interface (`src/store/store.ts`), so a database can replace the in-memory store later without changing them. The API has no seed data yet.

## Structure

```text
src/
├── app.ts          Creates the Express app (routes, JSON parsing, error handling)
├── server.ts       Starts the HTTP server and handles shutdown
├── config.ts       Reads and validates environment variables
├── errors.ts       ApiError, error codes, 404 and error handlers
├── version.ts      App version from package.json
├── domain/         Entity types and business rules, e.g. validation (no Express)
├── store/          The Store interface and its in-memory implementation
├── routes/         One router per area, e.g. properties.ts
└── test/           Test helpers
```

Tests start the app on a random port and call it with `fetch`, so they exercise real HTTP requests without extra libraries.
