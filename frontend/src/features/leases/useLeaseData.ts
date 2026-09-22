import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { loadLeaseData } from '../../services/leaseService'

/** Loads leases with their tenants, spaces and properties for the lease pages. */
export function useLeaseData() {
  const getDataLayer = useDataLayer()
  const load = useCallback(() => loadLeaseData(getDataLayer()), [getDataLayer])
  return useAsyncData(load)
}
