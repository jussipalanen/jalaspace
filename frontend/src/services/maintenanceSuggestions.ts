import type { Language } from '../i18n/languages'
import type { MaintenanceCategory, MaintenancePriority } from '../types/maintenance'
import {
  isMaintenanceCategory,
  isMaintenancePriority,
  MAINTENANCE_TITLE_MAX_LENGTH,
} from './maintenance'

/** The API refuses longer descriptions, which keeps requests small for the free AI quota. */
export const SUGGESTION_DESCRIPTION_MAX_LENGTH = 2000

/** The Render free plan can take up to a minute to wake up, so wait that long. */
const TIMEOUT_MS = 60_000

export interface MaintenanceSuggestion {
  title: string
  category: MaintenanceCategory
  priority: MaintenancePriority
}

/** Why no suggestion is available; the UI translates it (`maintenance.suggestion.errors.<code>`). */
export type SuggestionErrorCode =
  | 'required'
  | 'tooLong'
  | 'unavailable'
  | 'rateLimited'
  | 'invalidSuggestion'
  | 'network'

export class SuggestionRequestError extends Error {
  readonly code: SuggestionErrorCode

  constructor(code: SuggestionErrorCode) {
    super(code)
    this.name = 'SuggestionRequestError'
    this.code = code
  }
}

function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

/** Asks the API whether it can make maintenance suggestions (an AI provider is configured). */
export async function fetchSuggestionsAvailable(apiUrl: string, signal?: AbortSignal): Promise<boolean> {
  const response = await fetch(`${apiUrl}/api/features`, { signal: withTimeout(signal) })
  if (!response.ok) return false
  const features: unknown = await response.json()
  return (
    typeof features === 'object' &&
    features !== null &&
    (features as { maintenanceSuggestions?: unknown }).maintenanceSuggestions === true
  )
}

/** Maps the API's error codes to the codes the UI translates. */
function errorCodeFor(status: number, body: unknown): SuggestionErrorCode {
  const error = (body as { error?: { code?: unknown; fields?: { description?: unknown } } } | null)
    ?.error
  if (error?.code === 'validation_failed') {
    return error.fields?.description === 'tooLong' ? 'tooLong' : 'required'
  }
  if (error?.code === 'rate_limited' || status === 429) return 'rateLimited'
  if (error?.code === 'invalid_suggestion') return 'invalidSuggestion'
  return 'unavailable'
}

/**
 * Asks the API to suggest a title, category and priority for a description.
 * The answer is checked again here; nothing is saved.
 */
export async function requestMaintenanceSuggestion(
  apiUrl: string,
  description: string,
  language: Language,
  signal?: AbortSignal,
): Promise<MaintenanceSuggestion> {
  const text = description.trim()
  if (!text) throw new SuggestionRequestError('required')
  if (text.length > SUGGESTION_DESCRIPTION_MAX_LENGTH) throw new SuggestionRequestError('tooLong')

  let response: Response
  try {
    response = await fetch(`${apiUrl}/api/maintenance/suggestions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept-language': language },
      body: JSON.stringify({ description: text, language }),
      signal: withTimeout(signal),
    })
  } catch (error) {
    // Cancelled by the caller (e.g. the form closed): not an error to show.
    if (signal?.aborted) throw error
    throw new SuggestionRequestError('network')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new SuggestionRequestError(errorCodeFor(response.status, body))

  const { title, category, priority } = (body ?? {}) as Record<string, unknown>
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > MAINTENANCE_TITLE_MAX_LENGTH ||
    typeof category !== 'string' ||
    !isMaintenanceCategory(category) ||
    typeof priority !== 'string' ||
    !isMaintenancePriority(priority)
  ) {
    throw new SuggestionRequestError('invalidSuggestion')
  }
  return { title: title.trim(), category, priority }
}
