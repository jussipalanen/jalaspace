export const SUPPORTED_LANGUAGES = ['en', 'fi'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'en'

/** Locale used for number formatting and sorting in each language. */
export const LOCALES: Record<Language, string> = {
  en: 'en-GB',
  fi: 'fi-FI',
}

/** Each language is listed by its own name, so users can find theirs. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  fi: 'Suomi',
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * Picks the initial language: the stored choice, then the first supported
 * browser language (`fi-FI` → `fi`), then English.
 */
export function detectLanguage(stored: unknown, browserLanguages: readonly string[]): Language {
  if (isLanguage(stored)) return stored

  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLanguage(base)) return base
  }
  return DEFAULT_LANGUAGE
}
