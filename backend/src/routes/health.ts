import { Router } from 'express'

export interface HealthResponse {
  status: 'ok'
  version: string
}

/** `GET /api/health`: a cheap check that the API is up, for Docker and monitoring. */
export function healthRouter(version: string): Router {
  const router = Router()
  router.get('/health', (_request, response) => {
    const body: HealthResponse = { status: 'ok', version }
    response.json(body)
  })
  return router
}
