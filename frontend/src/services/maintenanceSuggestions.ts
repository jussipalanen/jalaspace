import type { Language } from '../i18n/languages'
import type { MaintenanceCategory, MaintenancePriority } from '../types/maintenance'
import {
  isMaintenanceCategory,
  isMaintenancePriority,
  MAINTENANCE_DESCRIPTION_MAX_LENGTH,
  MAINTENANCE_TITLE_MAX_LENGTH,
} from './maintenance'

/** The API refuses longer descriptions, which keeps requests small for the free AI quota. */
export const SUGGESTION_DESCRIPTION_MAX_LENGTH = 2000

/** The Render free plan can take up to a minute to wake up, so wait that long. */
const TIMEOUT_MS = 60_000

export interface MaintenanceSuggestion {
  title: string
  /** The user's facts written clearly, followed by typical things to check. */
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
}

/** Why no suggestion is available; the UI translates it (`maintenance.suggestion.errors.<code>`). */
export type SuggestionErrorCode =
  | 'required'
  | 'tooLong'
  | 'titleTooLong'
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

/** Maps the API's error codes to the codes the UI translates. */
function errorCodeFor(status: number, body: unknown): SuggestionErrorCode {
  const error = (
    body as { error?: { code?: unknown; fields?: { title?: unknown; description?: unknown } } } | null
  )?.error
  if (error?.code === 'validation_failed') {
    if (error.fields?.title === 'tooLong') return 'titleTooLong'
    return error.fields?.description === 'tooLong' ? 'tooLong' : 'required'
  }
  if (error?.code === 'rate_limited' || status === 429) return 'rateLimited'
  if (error?.code === 'invalid_suggestion') return 'invalidSuggestion'
  return 'unavailable'
}

/** What the user has written so far; one of them is enough. */
export interface SuggestionInput {
  title: string
  description: string
}

/**
 * Asks the API to suggest a title, a description, a category and a priority
 * from the user's title and/or description. The answer is checked again here; nothing is saved.
 */
export async function requestMaintenanceSuggestion(
  apiUrl: string,
  input: SuggestionInput,
  language: Language,
  signal?: AbortSignal,
): Promise<MaintenanceSuggestion> {
  const title = input.title.trim()
  const description = input.description.trim()
  if (!title && !description) throw new SuggestionRequestError('required')
  if (title.length > MAINTENANCE_TITLE_MAX_LENGTH) throw new SuggestionRequestError('titleTooLong')
  if (description.length > SUGGESTION_DESCRIPTION_MAX_LENGTH) throw new SuggestionRequestError('tooLong')

  let response: Response
  try {
    response = await fetch(`${apiUrl}/api/maintenance/suggestions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept-language': language },
      body: JSON.stringify({ title, description, language }),
      signal: withTimeout(signal),
    })
  } catch (error) {
    // Cancelled by the caller (e.g. the form closed): not an error to show.
    if (signal?.aborted) throw error
    throw new SuggestionRequestError('network')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new SuggestionRequestError(errorCodeFor(response.status, body))

  const {
    title: suggestedTitle,
    description: suggested,
    category,
    priority,
  } = (body ?? {}) as Record<string, unknown>
  if (
    typeof suggestedTitle !== 'string' ||
    !suggestedTitle.trim() ||
    suggestedTitle.length > MAINTENANCE_TITLE_MAX_LENGTH ||
    typeof suggested !== 'string' ||
    !suggested.trim() ||
    suggested.length > MAINTENANCE_DESCRIPTION_MAX_LENGTH ||
    typeof category !== 'string' ||
    !isMaintenanceCategory(category) ||
    typeof priority !== 'string' ||
    !isMaintenancePriority(priority)
  ) {
    throw new SuggestionRequestError('invalidSuggestion')
  }
  return { title: suggestedTitle.trim(), description: suggested.trim(), category, priority }
}
