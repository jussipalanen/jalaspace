import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { loadApplicationData } from '../../services/applicationService'

/** Loads the applications with their spaces, properties and leases for the application pages. */
export function useApplicationData() {
  const getDataLayer = useDataLayer()
  const load = useCallback(() => loadApplicationData(getDataLayer()), [getDataLayer])
  return useAsyncData(load)
}
