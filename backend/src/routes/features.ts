import { Router } from 'express'

export interface Features {
  /** Whether `POST /api/maintenance/suggestions` can answer (an AI provider is configured). */
  maintenanceSuggestions: boolean
  /** Whether `POST /api/ask` can answer (an AI provider is configured). */
  ask: boolean
}

/** `GET /api/features`: optional features the frontend can offer with this API. */
export function featuresRouter(features: Features): Router {
  const router = Router()
  router.get('/features', (_request, response) => {
    response.json(features)
  })
  return router
}
