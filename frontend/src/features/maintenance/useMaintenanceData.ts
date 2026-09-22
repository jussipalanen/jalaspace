import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { loadMaintenanceData } from '../../services/maintenanceService'

/** Loads the tasks with their properties and spaces for the maintenance pages. */
export function useMaintenanceData() {
  const getDataLayer = useDataLayer()
  const load = useCallback(() => loadMaintenanceData(getDataLayer()), [getDataLayer])
  return useAsyncData(load)
}
