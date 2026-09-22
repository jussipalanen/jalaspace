import { useCallback, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import {
  loadPropertyDetails,
  loadPropertyListData,
  toPropertySummaries,
} from '../../services/propertyService'

export function usePropertySummaries() {
  const getDataLayer = useDataLayer()
  const { locale } = useTranslation()
  const load = useCallback(() => loadPropertyListData(getDataLayer()), [getDataLayer])
  const state = useAsyncData(load)
  const data = state.status === 'success' ? state.data : null

  // Re-sorted for the active language without reloading data.
  const summaries = useMemo(() => (data ? toPropertySummaries(data, locale) : null), [data, locale])

  return { status: state.status, summaries, reload: state.reload }
}

export function usePropertyDetails(id: string) {
  const getDataLayer = useDataLayer()
  const load = useCallback(() => loadPropertyDetails(getDataLayer(), id), [getDataLayer, id])
  return useAsyncData(load)
}
