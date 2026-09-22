import { isRecord, readText, type ParseResult } from '../domain/common.ts'
import {
  isMaintenanceCategory,
  isMaintenancePriority,
  MAINTENANCE_DESCRIPTION_MAX_LENGTH,
  MAINTENANCE_TITLE_MAX_LENGTH,
  type MaintenanceCategory,
  type MaintenancePriority,
} from '../domain/maintenance.ts'

export const LANGUAGES = ['en', 'fi'] as const

export type Language = (typeof LANGUAGES)[number]

/** Longer descriptions are refused, which also keeps each request small for the free quota. */
export const SUGGESTION_DESCRIPTION_MAX_LENGTH = 2000

/** At least one of the title and the description has text. */
export interface SuggestionRequest {
  /** The user's title so far, or empty. */
  title: string
  /** The problem in the user's words, or empty. */
  description: string
  /** The language of the suggested title and description. */
  language: Language
}

export interface MaintenanceSuggestion {
  title: string
  /** The user's facts written clearly, followed by typical things to check. */
  description: string
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

/** Suggests a title, a description, a category and a priority from the user's title and description, e.g. with Gemini. */
export interface MaintenanceSuggester {
  suggest(request: SuggestionRequest): Promise<MaintenanceSuggestion>
}

/**
 * Checks a request body: a title, a description or both, e.g. only a title.
 * A missing language means English.
 */
export function parseSuggestionRequest(body: unknown): ParseResult<SuggestionRequest> {
  const source = isRecord(body) ? body : {}
  const errors: Partial<Record<keyof SuggestionRequest, 'required' | 'tooLong' | 'invalid'>> = {}

  const title = readText(source, 'title')
  if (title === undefined) errors.title = 'invalid'
  else if (title.length > MAINTENANCE_TITLE_MAX_LENGTH) errors.title = 'tooLong'

  const description = readText(source, 'description')
  if (description === undefined) errors.description = 'invalid'
  else if (description.length > SUGGESTION_DESCRIPTION_MAX_LENGTH) errors.description = 'tooLong'

  if (title === '' && description === '') errors.description = 'required'

  const language = source.language ?? 'en'
  if (!(LANGUAGES as readonly unknown[]).includes(language)) errors.language = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    values: { title: title!, description: description!, language: language as Language },
  }
}

/**
 * Checks what the model returned. Its output is never trusted: anything that
 * is not a usable title and description with a known category and priority is rejected.
 */
export function parseSuggestion(value: unknown): MaintenanceSuggestion {
  if (!isRecord(value)) throw new SuggestionError('invalid_suggestion', 'The answer is not an object')
  const title = typeof value.title === 'string' ? value.title.trim().replace(/\s+/g, ' ') : ''
  if (!title || title.length > MAINTENANCE_TITLE_MAX_LENGTH) {
    throw new SuggestionError('invalid_suggestion', 'The title is missing or too long')
  }
  // Keep line breaks between paragraphs, but no runs of spaces or empty lines.
  const description =
    typeof value.description === 'string'
      ? value.description
          .trim()
          .replace(/[^\S\n]+/g, ' ')
          .replace(/ ?\n ?/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
      : ''
  if (!description || description.length > MAINTENANCE_DESCRIPTION_MAX_LENGTH) {
    throw new SuggestionError('invalid_suggestion', 'The description is missing or too long')
  }
  if (!isMaintenanceCategory(value.category) || !isMaintenancePriority(value.priority)) {
    throw new SuggestionError('invalid_suggestion', 'Unknown category or priority')
  }
  return { title, description, category: value.category, priority: value.priority }
}
