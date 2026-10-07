import type { Language } from '../i18n/languages'
import type { Handbook } from './types'

// Each language is its own chunk, downloaded only when the handbook is opened.
const loaders: Record<Language, () => Promise<Handbook>> = {
  en: () => import('./content/en').then((module) => module.en),
  fi: () => import('./content/fi').then((module) => module.fi),
}

export function loadHandbook(language: Language): Promise<Handbook> {
  return loaders[language]()
}
