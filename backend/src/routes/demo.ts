import { Router } from 'express'
import { resetDemoData } from '../domain/demoData.ts'
import type { Store } from '../store/store.ts'

/**
 * `POST /api/demo/reset`: removes all data and restores the demo dataset.
 * Mounted only when the demo data is enabled, so it cannot wipe real data.
 */
export function demoRouter(store: Store): Router {
  const router = Router()
  router.post('/demo/reset', async (_request, response) => {
    await resetDemoData(store)
    response.status(204).end()
  })
  return router
}
