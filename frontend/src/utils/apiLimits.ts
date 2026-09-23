import type { Translate } from '../i18n/translate'
import { ApiRequestError } from '../repositories/api/apiRequest'

/** Limits of the public API that the UI explains; translated as `states.apiLimit.<code>`. */
export type ApiLimitCode = 'rateLimited' | 'limitReached'

/**
 * The API limit that stopped a save, if any: too many changes from this
 * client in a short time, or a full collection on the shared demo. Other
 * errors return `null`, and the UI shows its usual message.
 */
export function apiLimitCode(error: unknown): ApiLimitCode | null {
  if (!(error instanceof ApiRequestError)) return null
  if (error.code === 'rate_limited') return 'rateLimited'
  if (error.code === 'limit_reached') return 'limitReached'
  return null
}

/** The translated explanation of an API limit, or `fallback` for any other error. */
export function saveErrorMessage(error: unknown, t: Translate, fallback: string): string {
  const code = apiLimitCode(error)
  return code ? t(`states.apiLimit.${code}`) : fallback
}
