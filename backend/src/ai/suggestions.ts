import { isRecord, readText, type ParseResult } from '../domain/common.ts'
import {
  isMaintenanceCategory,
  isMaintenancePriority,
  MAINTENANCE_TITLE_MAX_LENGTH,
  type MaintenanceCategory,
  type MaintenancePriority,
} from '../domain/maintenance.ts'

export const LANGUAGES = ['en', 'fi'] as const

export type Language = (typeof LANGUAGES)[number]

/** Longer descriptions are refused, which also keeps each request small for the free quota. */
export const SUGGESTION_DESCRIPTION_MAX_LENGTH = 2000

export interface SuggestionRequest {
  description: string
  /** The language of the suggested title. */
  language: Language
}

export interface MaintenanceSuggestion {
  title: string
  category: MaintenanceCategory
  priority: MaintenancePriority
}

/** Why no suggestion could be made; returned to clients as the error code. */
export type SuggestionErrorCode = 'ai_unavailable' | 'rate_limited' | 'invalid_suggestion'

export class SuggestionError extends Error {
  readonly code: SuggestionErrorCode

  constructor(code: SuggestionErrorCode, message: string = code) {
    super(message)
    this.name = 'SuggestionError'
    this.code = code
  }
}

/** Suggests a title, category and priority for a maintenance description, e.g. with Gemini. */
export interface MaintenanceSuggester {
  suggest(request: SuggestionRequest): Promise<MaintenanceSuggestion>
}

/** Checks a request body; a missing language means English. */
export function parseSuggestionRequest(body: unknown): ParseResult<SuggestionRequest> {
  const source = isRecord(body) ? body : {}
  const errors: Partial<Record<keyof SuggestionRequest, 'required' | 'tooLong' | 'invalid'>> = {}

  const description = readText(source, 'description')
  if (description === undefined) errors.description = 'invalid'
  else if (!description) errors.description = 'required'
  else if (description.length > SUGGESTION_DESCRIPTION_MAX_LENGTH) errors.description = 'tooLong'

  const language = source.language ?? 'en'
  if (!(LANGUAGES as readonly unknown[]).includes(language)) errors.language = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, values: { description: description!, language: language as Language } }
}

/**
 * Checks what the model returned. Its output is never trusted: anything that
 * is not a usable title with a known category and priority is rejected.
 */
export function parseSuggestion(value: unknown): MaintenanceSuggestion {
  if (!isRecord(value)) throw new SuggestionError('invalid_suggestion', 'The answer is not an object')
  const title = typeof value.title === 'string' ? value.title.trim().replace(/\s+/g, ' ') : ''
  if (!title || title.length > MAINTENANCE_TITLE_MAX_LENGTH) {
    throw new SuggestionError('invalid_suggestion', 'The title is missing or too long')
  }
  if (!isMaintenanceCategory(value.category) || !isMaintenancePriority(value.priority)) {
    throw new SuggestionError('invalid_suggestion', 'Unknown category or priority')
  }
  return { title, category: value.category, priority: value.priority }
}
