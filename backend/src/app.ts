import express, { type Express, type Router } from 'express'
import type { RateLimiter } from './ai/rateLimit.ts'
import type { MaintenanceSuggester } from './ai/suggestions.ts'
import { cors } from './cors.ts'
import { errorHandler, notFoundHandler } from './errors.ts'
import { buildOpenApiDocument } from './openapi/document.ts'
import { listRoutes } from './openapi/routes.ts'
import { demoRouter } from './routes/demo.ts'
import { docsRouter } from './routes/docs.ts'
import { featuresRouter } from './routes/features.ts'
import { healthRouter } from './routes/health.ts'
import { leasesRouter } from './routes/leases.ts'
import { maintenanceRouter } from './routes/maintenance.ts'
import { propertiesRouter } from './routes/properties.ts'
import { spacesRouter } from './routes/spaces.ts'
import { suggestionsRouter } from './routes/suggestions.ts'
import { tenantsRouter } from './routes/tenants.ts'
import { createMemoryStore } from './store/memoryStore.ts'
import type { Store } from './store/store.ts'
import { VERSION } from './version.ts'

export interface AppOptions {
  version?: string
  /** Where the data is kept (default: a new, empty in-memory store). */
  store?: Store
  /** Enables `POST /api/demo/reset` (default: false). Seeding at start is up to the caller. */
  demoData?: boolean
  /** Makes AI maintenance suggestions (default: none, so the feature is off). */
  suggester?: MaintenanceSuggester | null
  /** Limits suggestion requests per client (default: 10 per 10 minutes). */
  suggestionRateLimiter?: RateLimiter
  /** Origins allowed to call the API from a browser (default: none). */
  corsOrigins?: readonly string[]
  /** Number of proxies in front of the API, e.g. 1 on Render (default: 0). */
  trustProxy?: number
  /** Extra routers mounted under /api, e.g. in tests. */
  routers?: Router[]
  /** Where unexpected errors are logged (default: console.error). */
  logError?: (error: unknown) => void
}

/** Creates the Express app. Kept separate from the server so tests can use it directly. */
export function createApp({
  version = VERSION,
  store = createMemoryStore(),
  demoData = false,
  suggester = null,
  suggestionRateLimiter,
  corsOrigins = [],
  trustProxy = 0,
  routers = [],
  logError,
}: AppOptions = {}): Express {
  const app = express()
  app.disable('x-powered-by')
  // Read the client IP from X-Forwarded-For, trusting only the known proxies.
  app.set('trust proxy', trustProxy)
  app.use(cors(corsOrigins))
  app.use(express.json({ limit: '100kb' }))

  const api = express.Router()
  api.use(healthRouter(version))
  api.use(featuresRouter({ maintenanceSuggestions: suggester !== null }))
  api.use(propertiesRouter(store))
  api.use(spacesRouter(store))
  api.use(maintenanceRouter(store))
  api.use(tenantsRouter(store))
  api.use(leasesRouter(store))
  api.use(suggestionsRouter({ suggester, rateLimiter: suggestionRateLimiter, logError }))
  if (demoData) api.use(demoRouter(store))
  for (const router of routers) api.use(router)
  app.use('/api', api)
  // Generated from the routes above, so the docs list exactly what this server offers.
  app.use(docsRouter(buildOpenApiDocument(listRoutes(api, '/api'), version)))

  app.use(notFoundHandler)
  app.use(errorHandler(logError))
  return app
}
