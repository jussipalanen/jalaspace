import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { buildDashboardSummary, type DashboardSummary } from '../../services/dashboard'
import { toIsoDate } from '../../utils/date'

export function useDashboard() {
  const getDataLayer = useDataLayer()

  const load = useCallback(async (): Promise<DashboardSummary> => {
    const { properties, spaces, tenants, leases, maintenance } = getDataLayer()
    const [propertyList, spaceList, tenantList, leaseList, taskList] = await Promise.all([
      properties.getAll(),
      spaces.getAll(),
      tenants.getAll(),
      leases.getAll(),
      maintenance.getAll(),
    ])
    return buildDashboardSummary(
      {
        properties: propertyList,
        spaces: spaceList,
        tenants: tenantList,
        leases: leaseList,
        maintenance: taskList,
      },
      toIsoDate(new Date()),
    )
  }, [getDataLayer])

  return useAsyncData(load)
}
