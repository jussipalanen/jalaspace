import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { loadHandbook } from '../../help/loadHandbook'
import { useTranslation } from '../../i18n/useTranslation'

/** The handbook in the active language, loaded again when the language changes. */
export function useHandbook() {
  const { language } = useTranslation()
  const load = useCallback(() => loadHandbook(language), [language])
  return useAsyncData(load)
}
