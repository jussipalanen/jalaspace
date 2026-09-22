import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { loadTenantData } from '../../services/tenantService'

/** Loads tenants with their leases, spaces and properties for the tenant pages. */
export function useTenantData() {
  const getDataLayer = useDataLayer()
  const load = useCallback(() => loadTenantData(getDataLayer()), [getDataLayer])
  return useAsyncData(load)
}
