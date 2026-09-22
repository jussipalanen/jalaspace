import express, { type Express, type Router } from 'express'
import { errorHandler, notFoundHandler } from './errors.ts'
import { demoRouter } from './routes/demo.ts'
import { healthRouter } from './routes/health.ts'
import { propertiesRouter } from './routes/properties.ts'
import { createMemoryStore } from './store/memoryStore.ts'
import type { Store } from './store/store.ts'
import { VERSION } from './version.ts'

export interface AppOptions {
  version?: string
  /** Where the data is kept (default: a new, empty in-memory store). */
  store?: Store
  /** Enables `POST /api/demo/reset` (default: false). Seeding at start is up to the caller. */
  demoData?: boolean
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
  routers = [],
  logError,
}: AppOptions = {}): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  const api = express.Router()
  api.use(healthRouter(version))
  api.use(propertiesRouter(store))
  if (demoData) api.use(demoRouter(store))
  for (const router of routers) api.use(router)
  app.use('/api', api)

  app.use(notFoundHandler)
  app.use(errorHandler(logError))
  return app
}
