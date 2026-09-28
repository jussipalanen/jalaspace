import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { loadOpenSpaces } from '../../services/applicationService'

/** Loads the spaces anyone can apply for, for the public pages. */
export function useOpenSpaces() {
  const getDataLayer = useDataLayer()
  const { locale } = useTranslation()
  const load = useCallback(() => loadOpenSpaces(getDataLayer(), locale), [getDataLayer, locale])
  return useAsyncData(load)
}
