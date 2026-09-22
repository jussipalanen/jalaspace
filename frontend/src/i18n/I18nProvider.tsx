import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  loadLanguagePreference,
  saveLanguagePreference,
} from '../repositories/localStorage/languagePreference'
import { I18nContext, type I18nContextValue } from './I18nContext'
import { detectLanguage, LOCALES, type Language } from './languages'
import { en, type Messages } from './locales/en'
import { fi } from './locales/fi'
import { createTranslator } from './translate'

const dictionaries: Record<Language, Messages> = { en, fi }

function browserLanguages(): readonly string[] {
  return typeof navigator === 'undefined' ? [] : navigator.languages
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    detectLanguage(loadLanguagePreference(), browserLanguages()),
  )

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    saveLanguagePreference(next)
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    const locale = LOCALES[language]
    return { language, locale, t: createTranslator(dictionaries[language], locale), setLanguage }
  }, [language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
