# JalaSpace API

The JalaSpace backend: a REST API written in TypeScript on Node.js 24 LTS with [Express 5](https://expressjs.com/).

It is at an early stage: it has the project setup and a health endpoint. Domain endpoints (properties, spaces, maintenance, tenants, leases) and the frontend's `api` data provider come next. Until then, the frontend keeps using browser localStorage.

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
  | 404    | `not_found`         | The route or resource does not exist  |
  | 413    | `payload_too_large` | The request body is over the limit    |
  | 500    | `internal_error`    | An unexpected error; details are only logged on the server, never sent |

- Route handlers throw `ApiError(status, code)` for expected errors; the shared error handler turns them into responses.
- The server stops gracefully on `SIGTERM` and `SIGINT`, letting open requests finish.

## Endpoints

| Method | Path          | Response                                   |
| ------ | ------------- | ------------------------------------------ |
| GET    | `/api/health` | `{ "status": "ok", "version": "x.y.z" }`   |

The version comes from `package.json`, which release-please keeps in step with the app version.

## Structure

```text
src/
├── app.ts          Creates the Express app (routes, JSON parsing, error handling)
├── server.ts       Starts the HTTP server and handles shutdown
├── config.ts       Reads and validates environment variables
├── errors.ts       ApiError, error codes, 404 and error handlers
├── version.ts      App version from package.json
├── routes/         One router per area, e.g. health.ts
└── test/           Test helpers
```

Tests start the app on a random port and call it with `fetch`, so they exercise real HTTP requests without extra libraries.
