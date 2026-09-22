import express, { type Express, type Router } from 'express'
import { errorHandler, notFoundHandler } from './errors.ts'
import { healthRouter } from './routes/health.ts'
import { VERSION } from './version.ts'

export interface AppOptions {
  version?: string
  /** Extra routers mounted under /api, e.g. in tests. */
  routers?: Router[]
  /** Where unexpected errors are logged (default: console.error). */
  logError?: (error: unknown) => void
}

/** Creates the Express app. Kept separate from the server so tests can use it directly. */
export function createApp({ version = VERSION, routers = [], logError }: AppOptions = {}): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  const api = express.Router()
  api.use(healthRouter(version))
  for (const router of routers) api.use(router)
  app.use('/api', api)

  app.use(notFoundHandler)
  app.use(errorHandler(logError))
  return app
}
