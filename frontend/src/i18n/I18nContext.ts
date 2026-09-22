import { createContext } from 'react'
import type { Language } from './languages'
import type { Translate } from './translate'

export interface I18nContextValue {
  language: Language
  /** BCP 47 locale for formatting and sorting, e.g. `fi-FI`. */
  locale: string
  t: Translate
  setLanguage(language: Language): void
}

export const I18nContext = createContext<I18nContextValue | null>(null)
