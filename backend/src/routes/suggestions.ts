import { Router } from 'express'
import { RateLimiter } from '../ai/rateLimit.ts'
import {
  parseSuggestionRequest,
  SuggestionError,
  type MaintenanceSuggester,
} from '../ai/suggestions.ts'
import { ApiError } from '../errors.ts'

const STATUS_BY_CODE = { ai_unavailable: 503, rate_limited: 429, invalid_suggestion: 502 } as const

export interface SuggestionsRouterOptions {
  /** `null` when no AI provider is configured: requests answer `503 ai_unavailable`. */
  suggester: MaintenanceSuggester | null
  rateLimiter?: RateLimiter
  logError?: (error: unknown) => void
}

/**
 * `POST /api/maintenance/suggestions`: suggests a title, a description, a category
 * and a priority from the user's title and/or description. Nothing is stored; the
 * user decides what to use.
 */
export function suggestionsRouter({
  suggester,
  rateLimiter = new RateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 }),
  logError = console.error,
}: SuggestionsRouterOptions): Router {
  const router = Router()

  router.post('/maintenance/suggestions', async (request, response) => {
    if (!suggester) throw new ApiError(503, 'ai_unavailable')

    const parsed = parseSuggestionRequest(request.body)
    if (!parsed.ok) throw new ApiError(400, 'validation_failed', { fields: parsed.errors })

    // `request.ip` is the client, not Render's proxy, when `trust proxy` is set.
    const limit = rateLimiter.hit(request.ip ?? 'unknown')
    if (!limit.allowed) {
      response.set('Retry-After', String(limit.retryAfterSeconds))
      throw new ApiError(429, 'rate_limited')
    }

    try {
      response.json(await suggester.suggest(parsed.values))
    } catch (error) {
      if (!(error instanceof SuggestionError)) throw error
      // Logged for debugging; the user's title and description are not logged.
      logError(`Maintenance suggestion failed: ${error.message}`)
      throw new ApiError(STATUS_BY_CODE[error.code], error.code)
    }
  })

  return router
}
