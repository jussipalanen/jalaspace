/** The Render free plan can take up to a minute to wake up, so wait that long. */
const TIMEOUT_MS = 60_000

/**
 * A failed API request. `code` is the API's error code (e.g. `validation_failed`,
 * `property_in_use`), or `network` when no answer arrived (offline, timeout).
 * `details` holds the error's other fields, e.g. the invalid fields.
 */
export class ApiRequestError extends Error {
  readonly status: number | null
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number | null, code: string, details: Record<string, unknown> = {}) {
    super(status === null ? `API request failed: ${code}` : `API request failed with ${status}: ${code}`)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** Reads `{ "error": { "code": … } }` from an error response. */
function errorFrom(status: number, body: unknown): ApiRequestError {
  const error = (body as { error?: unknown } | null)?.error
  if (typeof error === 'object' && error !== null) {
    const { code, ...details } = error as Record<string, unknown>
    if (typeof code === 'string') return new ApiRequestError(status, code, details)
  }
  return new ApiRequestError(status, 'unexpected_response')
}

/**
 * Sends a JSON request to the API. Resolves with the parsed body (`null` for
 * `204 No Content`); rejects with `ApiRequestError` for error responses,
 * network failures and timeouts.
 */
export async function apiRequest(
  baseUrl: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new ApiRequestError(null, 'network')
  }

  if (response.status === 204) return null
  const parsed: unknown = await response.json().catch(() => undefined)
  if (!response.ok) throw errorFrom(response.status, parsed)
  if (parsed === undefined) throw new ApiRequestError(response.status, 'unexpected_response')
  return parsed
}
