import { STORAGE_KEYS } from './keys'
import { readJson, writeJson } from './storage'

// Read synchronously so the first render already uses the right language.
export function loadLanguagePreference(): unknown {
  return readJson(STORAGE_KEYS.language)
}

export function saveLanguagePreference(language: string): void {
  try {
    writeJson(STORAGE_KEYS.language, language)
  } catch (error) {
    // The choice still applies for this visit; it just won't be remembered.
    if (import.meta.env.DEV) console.warn('Unable to save the language preference', error)
  }
}
