import type { ErrorRequestHandler, RequestHandler } from 'express'

/**
 * Error codes returned by the API. Responses carry codes, not English
 * messages, so the frontend can show them in the user's language.
 */
export type ErrorCode = 'not_found' | 'invalid_json' | 'payload_too_large' | 'internal_error'

export interface ErrorBody {
  error: { code: ErrorCode }
}

/** An error with an HTTP status and an API error code, thrown from route handlers. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode

  constructor(status: number, code: ErrorCode) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const body = (code: ErrorCode): ErrorBody => ({ error: { code } })

/** Responds 404 for routes that do not exist. */
export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json(body('not_found'))
}

/** Turns errors into JSON error codes, without leaking stack traces. */
export function errorHandler(log: (error: unknown) => void = console.error): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error)
      return
    }
    if (error instanceof ApiError) {
      response.status(error.status).json(body(error.code))
      return
    }
    // Errors from the JSON body parser carry a `type`.
    const type = (error as { type?: unknown } | null)?.type
    if (type === 'entity.parse.failed') {
      response.status(400).json(body('invalid_json'))
      return
    }
    if (type === 'entity.too.large') {
      response.status(413).json(body('payload_too_large'))
      return
    }
    log(error)
    response.status(500).json(body('internal_error'))
  }
}
