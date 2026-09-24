import { Router } from 'express'
import { AskError, parseAskRequest, type AskInterpreter } from '../ai/ask.ts'
import type { RateLimiter } from '../ai/rateLimit.ts'
import { ApiError } from '../errors.ts'

const STATUS_BY_CODE = { ai_unavailable: 503, rate_limited: 429, invalid_answer: 502 } as const

export interface AskRouterOptions {
  /** `null` when no AI provider is configured: requests answer `503 ai_unavailable`. */
  interpreter: AskInterpreter | null
  /** Shared with the other AI features, so together they stay within the free quota. */
  rateLimiter: RateLimiter
  logError?: (error: unknown) => void
}

/**
 * `POST /api/ask`: turns a question into a place in the app or a search filter.
 * The model never sees the data; the client searches its own data with the filter.
 */
export function askRouter({ interpreter, rateLimiter, logError = console.error }: AskRouterOptions): Router {
  const router = Router()

  router.post('/ask', async (request, response) => {
    if (!interpreter) throw new ApiError(503, 'ai_unavailable')

    const parsed = parseAskRequest(request.body)
    if (!parsed.ok) throw new ApiError(400, 'validation_failed', { fields: parsed.errors })

    const limit = rateLimiter.hit(request.ip ?? 'unknown')
    if (!limit.allowed) {
      response.set('Retry-After', String(limit.retryAfterSeconds))
      throw new ApiError(429, 'rate_limited')
    }

    try {
      response.json(await interpreter.interpret(parsed.values))
    } catch (error) {
      if (!(error instanceof AskError)) throw error
      // Logged for debugging; the question itself is not logged.
      logError(`Ask failed: ${error.message}`)
      throw new ApiError(STATUS_BY_CODE[error.code], error.code)
    }
  })

  return router
}
